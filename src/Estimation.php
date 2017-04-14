<?php


namespace kriskbx\gtt;


use Illuminate\Contracts\Support\Arrayable;
use kriskbx\gtt\Helper\ArrayAccessForGetterMethods;

/**
 * Class Estimation
 * @package kriskbx\gtt
 */
class Estimation implements Arrayable, \ArrayAccess
{
    use ArrayAccessForGetterMethods;

    protected $timeEstimate;

    protected $totalTimeSpent;

    protected $hoursPerDay;

    protected $timeFormat;

    /**
     * @return mixed
     */
    public function getTimeEstimate()
    {
        return $this->timeEstimate;
    }

    /**
     * @return mixed
     */
    public function getTotalTimeSpent()
    {
        return $this->totalTimeSpent;
    }

    /**
     * @return mixed
     */
    public function getHumanTimeEstimate()
    {
        return Time::humanReadable($this->timeEstimate, $this->hoursPerDay, $this->timeFormat);
    }

    /**
     * @return mixed
     */
    public function getHumanTotalTimeSpent()
    {
        return Time::humanReadable($this->totalTimeSpent, $this->hoursPerDay, $this->timeFormat);
    }

    /**
     * Estimation constructor.
     *
     * @param $timeEstimate
     * @param $totalTimeSpent
     * @param int $hoursPerDay
     * @param string $timeFormat
     */
    public function __construct($timeEstimate, $totalTimeSpent, $hoursPerDay = 8, $timeFormat = Time::TIME_FORMAT)
    {
        $this->timeEstimate   = $timeEstimate;
        $this->totalTimeSpent = $totalTimeSpent;
        $this->hoursPerDay    = $hoursPerDay;
        $this->timeFormat     = $timeFormat;
    }

    /**
     * Get a string representative of this.
     *
     * @param array $params
     *
     * @return string
     */
    public function toString($params = [])
    {
        $params['displayEstimationFunction'] = @$params['displayEstimationFunction'] ?: false;

        if ($params['displayEstimationFunction']) {
            return call_user_func_array($params['displayEstimationFunction'], [$this, $params]);
        } else {
            return $this->displayEstimation();
        }
    }

    /**
     * Default display estimation function.
     * @return string
     */
    protected function displayEstimation()
    {
        return $this->getHumanTimeEstimate() . ' / ' . $this->getHumanTotalTimeSpent();
    }

    /**
     * Create new object by the given array.
     *
     * @param array $data
     *
     * @return static
     */
    public static function fromArray(array $data)
    {
        return new static(
            @$data['time_estimate'],
            @$data['total_time_spent'],
            @$data['hours_per_day'],
            @$data['time_format']
        );
    }
}