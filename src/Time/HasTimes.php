<?php

namespace kriskbx\gtt\Time;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use kriskbx\gtt\Collection\TimesCollection;
use kriskbx\gtt\Estimation;
use kriskbx\gtt\Time;

trait HasTimes
{

    /**
     * @var string
     */
    static protected $timeSubRegex = '/subtracted (.*) of time spent/i';

    /**
     * @var string
     */
    static protected $timeRegex = '/added (.*) of time spent/i';

    /**
     * @var array
     */
    protected $excludeLabels = [];

    /**
     * @var array
     */
    protected $includeLabels = null;

    /**
     * Times for this Issue
     * @var array
     */
    protected $times = [];

    /**
     * Time estimation for this Issue.
     * @var Estimation
     */
    protected $estimation;

    /**
     * Overwrite parent __get method and parse dates as Carbon objects.
     *
     * @param string $property
     *
     * @return mixed
     */
    public function __get($property)
    {
        $value = parent::__get($property);

        if (in_array($property, @$this->dates ?: [])) {
            $value = Carbon::parse($value);
        }

        return $value;
    }

    /**
     * Return a string representative of this issue.
     *
     * @param array $params
     *
     * @return string
     */
    public function toString($params)
    {
        // Make sure things are set
        $params['columns'] = @$params['columns'] ?: [];

        // Get the columns as keys
        $issue = collect($params['columns'])->map(function ($column) {
            return ['key' => camel_case($column)];
        })->keyBy('key');

        // Insert data from this issue to columns
        $issue = $issue->map(function ($val, $column) {
            $getterName = "get" . ucfirst($column);

            $value = false;

            if (method_exists($this, $getterName)) {
                $value = call_user_func([$this, $getterName]);
            }

            if (in_array($column, @$this->arrays ?: [])) {
                $value = implode(', ', $value);
            }

            return $value;
        });

        // Stringify columns
        return $issue->toString($params);
    }

    /**
     * @param array $excludeLabels
     */
    public function setExcludeLabels($excludeLabels)
    {
        $this->excludeLabels = $excludeLabels;
    }

    /**
     * @param array $includeLabels
     */
    public function setIncludeLabels($includeLabels)
    {
        $this->includeLabels = $includeLabels;
    }

    /**
     * @return array
     */
    public function getTimes()
    {
        return $this->times;
    }

    /**
     * @return Estimation
     */
    public function getEstimation()
    {
        return $this->estimation;
    }

    /**
     * @param Carbon $from
     * @param Carbon $to
     * @param string $user
     *
     * @throws \Exception
     */
    public function setTimes(Carbon $from, Carbon $to, $user)
    {
        // Get time stats
        $this->setTimeStats();

        // Get comments
        $comments = collect([]);

        $page    = 1;
        $perPage = 100;

        // Loop through all pages
        while (true) {
            $response = collect($this->showComments($page, $perPage));
            $comments = $comments->merge($response);

            $page++;

            if ($response->count() < $perPage) {
                break;
            }
        }

        // Only include time tracking comments
        $comments = $comments->filter(function ($comment) {
            return $comment->system && (
                    preg_match_all(self::$timeSubRegex, $comment->body) ||
                    preg_match_all(self::$timeRegex, $comment->body)
                );
        });

        // Replace each comment with a Time object
        $comments = $comments->map(function ($comment) use ($to, $from, $user) {
            // Filter out time that has not been spent by the given user
            if ($user && $user != $comment->author->username) {
                return false;
            }

            // Create time object
            $time = new Time($comment->created_at, null, $comment->author->username);

            // Filter out time that's not within the given from/to period
            if ( ! $time->getDate()->greaterThanOrEqualTo($from) || ! $time->getDate()->lessThanOrEqualTo($to)) {
                return false;
            }

            // Prefix negative time
            if (preg_match(self::$timeSubRegex, $comment->body, $matches)) {
                $humanReadable = "-" . $matches[1];
            } elseif (preg_match(self::$timeRegex, $comment->body, $matches)) {
                $humanReadable = $matches[1];
            } else {
                return false;
            }

            // Set time
            $time->setHumanReadable($humanReadable);

            // Set user (just for grouping them together)
            $user = @$comment->author->username;

            return compact('time', 'user');
        });

        // Filter out empty comments
        $comments = $comments->filter(function ($comment) {
            return is_array($comment);
        });

        // Group them by author
        $comments = $comments->groupBy('user');

        // Get rid of the 'user' - that was just for grouping
        $comments = $comments->map(function ($comment) {
            return $comment->pluck('time');
        });

        // Convert to a TimesCollection
        $comments = new TimesCollection($comments->firstLevelToArray());

        $this->times = $comments;
    }
}