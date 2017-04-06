<?php


namespace kriskbx\gtt\Api;


use Gitlab\Api\AbstractApi;

class TimeStats extends AbstractApi
{
    /**
     * @param int $project_id
     * @param int $issue_id
     *
     * @return mixed
     */
    public function getTimeStats($project_id, $issue_id)
    {
        return $this->get($this->getProjectPath($project_id, 'issues/' . $this->encodePath($issue_id)) . '/time_stats');
    }
}