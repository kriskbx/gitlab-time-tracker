<?php

namespace kriskbx\gtt;

use Gitlab\Model\Milestone;
use Gitlab\Model\Note;
use Gitlab\Model\Project;
use Gitlab\Model\User;
use Illuminate\Contracts\Support\Arrayable;
use kriskbx\gtt\Api\Issues;
use kriskbx\gtt\Api\IssueTimeStats;
use kriskbx\gtt\Helper\ArrayAccessForGetterMethods;
use kriskbx\gtt\Time\HasTimes;
use kriskbx\gtt\Time\TimeAble;

class Issue extends \Gitlab\Model\Issue implements \ArrayAccess, Arrayable, TimeAble
{
    use ArrayAccessForGetterMethods, HasTimes;

    /**
     * Don't include these 'properties' in ArrayAccess or toArray method
     * @var array
     */
    protected $methodExceptions = [
        'data',
        'client'
    ];

    /**
     * Parse this properties as Carbon objects
     * @var array
     */
    protected $dates = [
        'created_at',
        'updated_at'
    ];

    /**
     * Parse this properties as arrays and implode them as a string.
     * @var array
     */
    protected $arrays = [
        'labels'
    ];

    /**
     * @return string
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @return array
     */
    public function getLabels()
    {
        return collect($this->labels)
            ->filter(function ($label) {
                return ! in_array($label, $this->excludeLabels) &&
                       ( ! $this->includeLabels || count($this->includeLabels) == 0 || in_array($label,
                               $this->includeLabels));
            })
            ->toArray();
    }

    /**
     * @return bool
     */
    public function isClosed()
    {
        return $this->closed;
    }

    /**
     * @return string
     */
    public function getUpdatedAt()
    {
        return $this->updated_at;
    }

    /**
     * @return string
     */
    public function getCreatedAt()
    {
        return $this->created_at;
    }

    /**
     * @return string
     */
    public function getState()
    {
        return $this->state;
    }

    /**
     * @return User
     */
    public function getAssignee()
    {
        return $this->assignee;
    }

    /**
     * @return User
     */
    public function getAuthor()
    {
        return $this->author;
    }

    /**
     * @return Milestone
     */
    public function getMilestone()
    {
        return $this->milestone;
    }

    /**
     * @return Project
     */
    public function getProject()
    {
        return $this->project;
    }

    /**
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @return int
     */
    public function getProjectId()
    {
        return $this->project_id;
    }

    /**
     * @return int
     */
    public function getIid()
    {
        return $this->iid;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set time stats (estimated, spent)
     */
    public function setTimeStats()
    {
        $stats            = (new IssueTimeStats($this->client))->getTimeStats($this->project_id, $this->iid);
        $this->estimation = Estimation::fromArray($stats);
    }

    /**
     * Fixing errors in GitLab PHP Api...
     *
     * @param int $page
     * @param int $per_page
     *
     * @return Note[]
     */
    public function showComments($page = 1, $per_page = 20)
    {
        $notes = array();
        $data  = (new Issues($this->client))->showComments($this->project->id, $this->iid, $page, $per_page);

        foreach ($data as $note) {
            $notes[] = Note::fromArray($this->getClient(), $this, $note);
        }

        return $notes;
    }
}