<?php

namespace kriskbx\gtt\Output;


use Illuminate\Support\Collection;

interface OutputInterface
{

    /**
     * Render.
     *
     * @param Collection $issues
     * @param array $params
     *
     * @return mixed
     */
    public function render(Collection $issues, array $params);

}