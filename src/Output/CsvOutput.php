<?php


namespace kriskbx\gtt\Output;


use Illuminate\Support\Collection;
use kriskbx\gtt\Issue;
use kriskbx\gtt\Time;
use League\Csv\Writer;
use SplTempFileObject;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

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