<?php


namespace kriskbx\gtt;


use Carbon\Carbon;
use Gitlab\Client;
use kriskbx\gtt\Api\Issues;
use kriskbx\gtt\Config\Config;

class Report
{
    protected $from;

    protected $to;

    protected $closed;

    protected $projectName;

    protected $project;

    protected $issues;

    protected $columns;

    protected $user;

    protected $milestone;

    protected $includeLabels;

    protected $excludeLabels;

    protected $includeByLabels;

    protected $excludeByLabels;

    protected $timeFormat;

    protected $client;

    protected $hoursPerDay;

    /**
     * Report constructor.
     *
     * @param Client $client
     * @param Config $config
     */
    public function __construct(Client $client, Config $config)
    {
        $this->client      = $client;

        collect($config->toArray())->each(function ($value, $property) {
            if (property_exists($this, $property)) {
                $this->$property = $value;
            }
        });

        $this->setProject();
    }

    /**
     * Get params for querying issues. Is sued to filter out issues in the first place.
     */
    protected function getParams()
    {
        $params = [];

        if ($this->includeByLabels) {
            $params['labels'] = implode(',', $this->includeByLabels);
        }

        if ($this->closed == false) {
            $params['state'] = 'opened';
        }

        if ($this->milestone) {
            $params['milestone'] = $this->milestone;
        }

        return $params;
    }

    /**
     * Set times in the given issues.
     *
     * @param callable|null $advance
     */
    public function setTimesInIssues(callable $advance = null)
    {
        $this->issues = $this->issues->map(function (Issue $issue) use ($advance) {
            if ($advance) {
                $advance();
            }

            $issue->setTimes($this->from, $this->to, $this->user, $this->hoursPerDay, $this->timeFormat);

            return $issue;
        })->filter(function (Issue $issue) {
            return $issue->getTimes()->count() > 0;
        });
    }

    /**
     * Get all Issues by the given project and params.
     */
    public function setIssues()
    {
        $this->issues = collect();

        $page    = 1;
        $perPage = 100;

        // Loop through all pages
        while (true) {
            $response     = collect((new Issues($this->client))->all($this->project->id, $page, $perPage,
                $this->getParams()));
            $this->issues = $this->issues->merge($response);

            $page++;

            if ($response->count() < $perPage) {
                break;
            }
        }

        // Create Issue objects
        $this->issues = $this->issues->map(function ($data) {
            $issue = Issue::fromArray($this->client, $this->project, $data);

            $issue->setIncludeLabels($this->includeLabels);
            $issue->setExcludeLabels($this->excludeLabels);

            return $issue;
        })->filter(function ($issue) {
            return collect($issue->labels)->filter(function ($label) {
                    return in_array($label, $this->excludeByLabels);
                })->count() == 0;
        });
    }

    /**
     * Get Project by the given name.
     * @throws \Exception
     */
    public function setProject()
    {
        try {
            $this->project = (new Project($this->projectName, $this->client))->show();
        } catch (\Exception $e) {
            throw new \Exception("Project '{$this->projectName}' not found!", 1, $e);
        }
    }

    /**
     * @return mixed
     */
    public function getColumns()
    {
        return $this->columns;
    }

    /**
     * @return mixed
     */
    public function getIssues()
    {
        return $this->issues;
    }

    public function filterIssues($closure)
    {
        $this->issues = $this->issues->filter($closure);
    }

    protected function toBool($string)
    {
        return $string === true || $string === 1 || $string === 'true' || $string === '1';
    }
}