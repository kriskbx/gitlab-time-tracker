<?php


namespace kriskbx\gtt\Collection;


use Illuminate\Support\Collection;
use kriskbx\gtt\Time;

/**
 * Class TimesCollection
 *
 * Time should be rendered differently, so we extend the base Collection and implement our own toString method.
 * @package kriskbx\gtt\Collection
 */
class TimesCollection extends Collection
{
    /**
     * Convert the times collection to a string.
     *
     * @param array $params
     *
     * @return string
     */
    public function toString($params = [])
    {
        // Make sure things are set
        $params['displayUserFunction'] = @$params['displayUserFunction'] ?: false;
        $params['beforeHeadline']      = @$params['beforeHeadline'] ?: '';
        $params['afterHeadline']       = @$params['afterHeadline'] ?: '';
        $params['timesDelimiter']      = @$params['timesDelimiter'] ?: '';
        $params['break']               = @$params['break'] ?: '';
        $params['delimiter']           = $params['break'];

        return $this->map(function (Collection $times, $user) use ($params) {
            if ($params['displayUserFunction']) {
                $string = call_user_func_array($params['displayUserFunction'], [$times, $user, $params]);
            } else {
                $string = $this->displayUser($times, $user, $params);
            }

            $string .= $times->toString($params);

            return $string;
        })->implode($params['timesDelimiter']);
    }

    /**
     * Default function that "displays" a user.
     *
     * @param Collection $times
     * @param string $user
     * @param array $params
     *
     * @return string
     */
    protected function displayUser(Collection $times, $user, array $params)
    {
        $totalTime = Time::humanReadable($times->reduce(function ($carry, Time $item) {
            return $carry + (int)$item->getSeconds();
        }));

        return "{$params['beforeHeadline']}$user: {$totalTime}{$params['afterHeadline']}{$params['break']}";
    }
}