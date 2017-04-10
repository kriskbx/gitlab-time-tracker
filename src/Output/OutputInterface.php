<?php

namespace kriskbx\gtt\Output;


use Illuminate\Support\Collection;

interface OutputInterface
{

    /**
     * Render.
     *
     * @param Collection $issues
     * @param string $title
     * @param array $params
     *
     * @return mixed
     */
    public function render(Collection $issues, $title, array $params);

}