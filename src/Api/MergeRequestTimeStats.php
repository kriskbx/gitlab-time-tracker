<?php


namespace kriskbx\gtt\Api;


use Gitlab\Api\AbstractApi;

/**
 * Class TimeStats
 * @package kriskbx\gtt\Api
 */
class MergeRequestTimeStats extends AbstractApi
{
    /**
     * @param int $project_id
     * @param int $issue_id
     *
     * @return mixed
     */
    public function getTimeStats($project_id, $issue_id)
    {
        return $this->get($this->getProjectPath($project_id,
                'merge_request/' . $this->encodePath($issue_id)) . '/time_stats');
    }
}