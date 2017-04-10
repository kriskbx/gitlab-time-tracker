<?php

namespace kriskbx\gtt\Helper;

/**
 * Class ArrayAccessForGetterMethods
 *
 * Automagically uses all available getter methods in a class for the toArray method
 * as well as for the ArrayAccess Interface.
 * @package kriskbx\gtt\Helper
 */
trait ArrayAccessForGetterMethods
{

    /**
     * @return array
     */
    protected function methodExceptions()
    {
        return @$this->methodExceptions ?: [];
    }

    /**
     * @param string $offset
     *
     * @return string
     */
    protected function getOffsetFunctionName($offset)
    {
        return "get" . ucfirst($offset);
    }

    /**
     * @param string $offset
     *
     * @return void
     *
     * @throws \Exception
     */
    public function offsetExists($offset)
    {
        if (in_array($offset, $this->methodExceptions()) || ! method_exists($this,
                $this->getOffsetFunctionName($offset))
        ) {
            throw new \Exception("Offset '{$offset}' doesn't exist.");
        }
    }

    /**
     * @param string $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return call_user_func([$this, $this->getOffsetFunctionName($offset)]);
    }

    /**
     * @param string $offset
     * @param mixed $value
     *
     * @return mixed
     */
    public function offsetSet($offset, $value)
    {
        return call_user_func_array([$this, $this->getOffsetFunctionName($offset)], [$value]);
    }

    /**
     * @param string $offset
     *
     * @return mixed
     */
    public function offsetUnset($offset)
    {
        return call_user_func_array([$this, $this->getOffsetFunctionName($offset)], [null]);
    }

    /**
     * @return array
     */
    public function toArray()
    {
        $reflection = new \ReflectionObject($this);
        $methods    = collect($reflection->getMethods(\ReflectionMethod::IS_PUBLIC));

        return $methods
            ->filter(function ($method) {
                return substr($method->name, 0, 3) == "get"
                       && ! in_array(snake_case(str_replace('get', '', $method->name)), $this->methodExceptions());
            })
            ->map(function ($method) {
                return [
                    'key'   => snake_case(str_replace('get', '', $method->name)),
                    'value' => call_user_func([$this, $method->name])
                ];
            })
            ->pluck('value', 'key')
            ->firstLevelToArray();
    }

}