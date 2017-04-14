<?php


namespace kriskbx\gtt\Config;


use Exception;
use Illuminate\Contracts\Support\Arrayable;
use kriskbx\gtt\Time;
use Symfony\Component\Yaml\Yaml;

/**
 * Class Config
 * @package kriskbx\gtt\Config
 */
class Config implements \ArrayAccess, Arrayable
{
    /**
     * @var string
     */
    static $DIR_NAME = '.gtt';

    /**
     * @var string
     */
    static $FILE_NAME = 'config.yml';

    /**
     * @var string
     */
    static $TIMES_DIR = 'times';

    /**
     * @var string
     */
    static $DEPRECATED_FILE = '.gitlab-time.yml';

    /**
     * @var array
     */
    protected $config = [];

    /**
     * Config constructor.
     */
    public function __construct()
    {
        $this->preFlight();
        $this->parse();
        $this->defaults();
    }

    /**
     * @return string
     */
    public static function getDir()
    {
        return $_SERVER['HOME'] . DIRECTORY_SEPARATOR . static::$DIR_NAME;
    }

    /**
     * @return string
     */
    public static function getFile()
    {
        return self::getDir() . DIRECTORY_SEPARATOR . static::$FILE_NAME;
    }

    /**
     * @return string
     */
    public static function getDeprecatedFile()
    {
        return $_SERVER['HOME'] . DIRECTORY_SEPARATOR . static::$DEPRECATED_FILE;
    }

    /**
     * @return string
     */
    public static function getTimesDir()
    {
        return self::getDir() . DIRECTORY_SEPARATOR . static::$TIMES_DIR;
    }

    /**
     * Ensure dir and file exist
     */
    protected function preFlight()
    {
        if ( ! file_exists(self::getDir())) {
            mkdir(self::getDir(), 0755, true);
        }

        if ( ! file_exists(self::getTimesDir())) {
            mkdir(self::getTimesDir(), 0755, true);
        }

        if (file_exists(self::getDeprecatedFile())) {
            copy(self::getDeprecatedFile(), self::getFile());
            unlink(self::getDeprecatedFile());
        } elseif ( ! file_exists(self::getFile())) {
            touch(self::getFile());
        }
    }

    /**
     * Parse config.
     */
    protected function parse()
    {
        try {
            $this->config = Yaml::parse(file_get_contents(static::getFile())) ?: [];
        } catch (Exception $e) {
            echo "Invalid config file '" . static::getFile() . "'.\n";
            exit(1);
        }
    }

    /**
     * Set default values.
     */
    protected function defaults()
    {
        $this->config = array_merge($this->config, [
            'configFile'      => static::getFile(),
            'url'             => @$this->config['url'] ?: 'http://gitlab.com/api/v4/',
            'token'           => @$this->config['token'] ?: false,
            'project'         => @$this->config['project'] ?: false,
            'closed'          => @$this->config['closed'] ?: false,
            'milestone'       => @$this->config['milestone'] ?: null,
            'output'          => @$this->config['output'] ?: null,
            'hoursPerDay'     => @$this->config['hoursPerDay'] ?: 8,
            'columns'         => @$this->config['columns'] ?: ['iid', 'title', 'estimation'],
            'dateFormat'      => @$this->config['dateFormat'] ?: 'd.m.Y H:i',
            'timeFormat'      => @$this->config['timeFormat'] ?: Time::TIME_FORMAT,
            'excludeByLabels' => @$this->config['excludeByLabels'] ?: [],
            'includeByLabels' => @$this->config['includeByLabels'] ?: [],
            'excludeLabels'   => @$this->config['excludeLabels'] ?: [],
            'includeLabels'   => @$this->config['includeLabels'] ?: []
        ]);
    }

    public function offsetExists($offset)
    {
        return (bool)@$this->config[$offset];
    }

    public function offsetGet($offset)
    {
        return $this->config[$offset];
    }

    public function offsetSet($offset, $value)
    {
        $this->config[$offset] = $value;
    }

    public function offsetUnset($offset)
    {
        unset($this->config[$offset]);
    }

    public function toArray()
    {
        return $this->config;
    }
}