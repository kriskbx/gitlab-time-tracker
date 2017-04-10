<?php


namespace kriskbx\gtt;


use Gitlab\Model\Note;
use Illuminate\Contracts\Support\Arrayable;
use kriskbx\gtt\Api\MergeRequests;
use kriskbx\gtt\Helper\ArrayAccessForGetterMethods;
use kriskbx\gtt\Time\HasTimes;
use kriskbx\gtt\Time\TimeAble;

class MergeRequest extends \Gitlab\Model\MergeRequest implements \ArrayAccess, Arrayable, TimeAble
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
    protected $dates = [];

    /**
     * Parse this properties as arrays and implode them as a string.
     * @var array
     */
    protected $arrays = [
        'labels'
    ];

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
        $data  = (new MergeRequests($this->client))->showComments($this->project->id, $this->id, $page, $per_page);

        foreach ($data as $note) {
            $notes[] = Note::fromArray($this->getClient(), $this, $note);
        }

        return $notes;
    }
}