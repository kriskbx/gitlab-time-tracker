<?php


namespace kriskbx\gtt\Api;


class MergeRequests extends \Gitlab\Api\MergeRequests
{
    /**
     * Overwriting the GitLab API package showComments function, because it doesn't
     * support pagination.
     *
     * @param int $project_id
     * @param int $mr_id
     * @param int $page
     * @param int $per_page
     *
     * @return mixed
     */
    public function showComments($project_id, $mr_id, $page = 1, $per_page = self::PER_PAGE)
    {
        $params = [
            'page'     => $page,
            'per_page' => $per_page
        ];

        return $this->get($this->getProjectPath($project_id,
            'merge_request/' . $this->encodePath($mr_id) . '/comments'), $params);
    }
}