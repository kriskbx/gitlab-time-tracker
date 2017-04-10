<?php

namespace kriskbx\gtt\Time;


use Carbon\Carbon;

interface TimeAble
{
    /**
     * Return a string representative.
     *
     * @param array $params
     *
     * @return string
     */
    public function toString($params);

    /**
     * @param array $excludeLabels
     */
    public function setExcludeLabels($excludeLabels);

    /**
     * @param array $includeLabels
     */
    public function setIncludeLabels($includeLabels);

    /**
     * @param Carbon $from
     * @param Carbon $to
     * @param string $user
     *
     * @throws \Exception
     */
    public function setTimes(Carbon $from, Carbon $to, $user);
}