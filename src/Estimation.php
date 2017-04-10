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

    protected $humanTimeEstimate;

    protected $humanTotalTimeSpent;

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
        return $this->humanTimeEstimate;
    }

    /**
     * @return mixed
     */
    public function getHumanTotalTimeSpent()
    {
        return $this->humanTotalTimeSpent;
    }

    /**
     * Estimation constructor.
     *
     * @param $timeEstimate
     * @param $totalTimeSpent
     * @param $humanTimeEstimate
     * @param $humanTotalTimeSpent
     */
    public function __construct($timeEstimate, $totalTimeSpent, $humanTimeEstimate, $humanTotalTimeSpent)
    {
        $this->timeEstimate        = $timeEstimate;
        $this->totalTimeSpent      = $totalTimeSpent;
        $this->humanTimeEstimate   = $humanTimeEstimate;
        $this->humanTotalTimeSpent = $humanTotalTimeSpent;
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
        return $this->humanTimeEstimate . ' / ' . $this->humanTotalTimeSpent;
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
            @$data['human_time_estimate'],
            @$data['human_total_time_spent']
        );
    }
}