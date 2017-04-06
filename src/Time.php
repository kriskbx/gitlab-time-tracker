<?php

namespace kriskbx\gtt;

use ArrayAccess;
use Carbon\Carbon;
use Illuminate\Contracts\Support\Arrayable;
use kriskbx\gtt\Helper\ArrayAccessForGetterMethods;

class Time implements ArrayAccess, Arrayable
{
    use ArrayAccessForGetterMethods;

    protected $seconds;
    protected $user;
    protected $date;
    private $hoursPerDay;

    /**
     * Time constructor.
     *
     * @param mixed $date
     * @param mixed $input
     * @param string $user
     * @param int $hoursPerDay
     */
    public function __construct($date = null, $input = null, $user = null, $hoursPerDay = 8)
    {
        if ($date) {
            $this->date = Carbon::parse($date);
        }

        if (is_numeric($input)) {
            $this->seconds = $input;
        } elseif (is_string($input)) {
            $this->seconds = self::parse($input);
        }

        $this->user        = $user;
        $this->hoursPerDay = $hoursPerDay;
    }

    /**
     * @param string $user
     */
    public function setUser($user)
    {
        $this->user = $user;
    }

    /**
     * @return string
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param string $date
     */
    public function setDate($date)
    {
        $this->date = Carbon::parse($date);
    }

    /**
     * @param string $format
     *
     * @return mixed
     */
    public function getDate($format = null)
    {
        if ($format) {
            return $this->date->format($format);
        }

        return $this->date;
    }

    /**
     * @return int
     */
    public function getSeconds()
    {
        return $this->seconds;
    }

    /**
     * @param int $seconds
     */
    public function setSeconds($seconds)
    {
        $this->seconds = $seconds;
    }

    /**
     * @return string
     */
    public function getHumanReadable()
    {
        return self::humanReadable($this->seconds, $this->hoursPerDay);
    }

    /**
     * @param string $humanReadable
     */
    public function setHumanReadable($humanReadable)
    {
        $this->seconds = self::parse($humanReadable);
    }

    /**
     * Seconds to human readable string.
     *
     * @param int $seconds
     * @param int $hoursPerDay
     *
     * @return string
     */
    static public function humanReadable($seconds, $hoursPerDay = 8)
    {
        $sign    = $seconds < 0 ? '-' : '';
        $seconds = abs($seconds);

        $secondsInAMinute = 60;
        $secondsInAnHour  = 60 * $secondsInAMinute;
        $secondsInADay    = $hoursPerDay * $secondsInAnHour;

        $days             = floor($seconds / $secondsInADay);
        $hourSeconds      = $seconds % $secondsInADay;
        $hours            = floor($hourSeconds / $secondsInAnHour);
        $minuteSeconds    = $hourSeconds % $secondsInAnHour;
        $minutes          = floor($minuteSeconds / $secondsInAMinute);
        $remainingSeconds = $minuteSeconds % $secondsInAMinute;
        $seconds          = ceil($remainingSeconds);

        $string = $days ? (int)$days . 'd ' : '';
        $string .= $hours ? (int)$hours . 'h ' : '';
        $string .= $minutes ? (int)$minutes . 'm ' : '';
        $string .= $seconds ? (int)$seconds . 's' : '';

        return $sign . trim($string);
    }

    /**
     * Parse the given human readable string and return seconds.
     *
     * @param string $humanReadable
     * @param int $hoursPerDay
     *
     * @return int
     */
    static public function parse($humanReadable, $hoursPerDay = 8)
    {
        preg_match('/^(?:(?<sign>[-])\s*)?(?:(?<days>\d+)d\s*)?(?:(?<hours>\d+)h\s*)?(?:(?<minutes>\d+)m\s*)?(?:(?<seconds>\d+)s\s*)?$/',
            $humanReadable, $matches);

        return
            (@$matches['sign'] ? -1 : 1) * (
                ((@$matches['days'] ?: 0) * $hoursPerDay * 60 * 60) +
                ((@$matches['hours'] ?: 0) * 60 * 60) +
                ((@$matches['minutes'] ?: 0) * 60) +
                (@$matches['seconds'] ?: 0)
            );
    }

    /**
     * @param array $params
     *
     * @return string
     */
    public function toString($params = [])
    {
        // Make sure things are set
        $params['beforeHighlight'] = @$params['beforeHighlight'] ?: '';
        $params['afterHighlight']  = @$params['afterHighlight'] ?: '';
        $params['dateFormat']      = @$params['dateFormat'] ?: 'Y-m-d H:i:m';

        return $params['beforeHighlight'] . $this->getHumanReadable() . $params['afterHighlight'] . " (" . $this->getDate($params['dateFormat']) . ")";
    }
}