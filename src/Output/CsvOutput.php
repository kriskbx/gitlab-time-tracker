<?php


namespace kriskbx\gtt\Output;

use Illuminate\Support\Collection;
use kriskbx\gtt\Issue;
use League\Csv\Writer;
use SplTempFileObject;

class CsvOutput extends AbstractOutput
{
    /**
     * @var Writer
     */
    protected $writer;

    /**
     * Render.
     *
     * @param Collection $issues
     * @param string $title
     * @param array $params
     *
     * @return void
     */
    public function render(Collection $issues, $title, array $params)
    {
        $params = array_merge($params, [
            'columns'         => $this->columns,
            'delimiter'       => " | ",
            'timesDelimiter'  => "\n\n",
            'break'           => "\n",
            'beforeHighlight' => "",
            'afterHighlight'  => "",
            'beforeHeadline'  => "",
            'afterHeadline'   => ""
        ]);

        $rows = [
            $this->columns
        ];

        $issues->each(function (Issue $issue) use ($params, &$rows) {
            $rows[] = explode($params['delimiter'], $issue->toString($params));
        });

        $this->writer = Writer::createFromFileObject(new SplTempFileObject);
        $this->writer->setDelimiter(';');
        $this->writer->insertAll($rows);

        $this->write($this->writer->__toString(), $this->file);
    }
}