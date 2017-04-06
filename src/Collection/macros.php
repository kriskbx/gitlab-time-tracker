<?php

\Illuminate\Support\Collection::macro('toString', function ($params = []) {
    return collect($this->items)
        ->map(function ($value) use ($params) {
            if ( ! is_object($value) && ! is_array($value)) {
                return $value;
            }

            if (is_array($value)) {
                return json_encode($value);
            }

            try {
                return call_user_func_array([$value, 'toString'], [$params]);
            } catch (Exception $e) {
                try {
                    return call_user_func([$value, 'toJson']);
                } catch (Exception $e) {
                    return json_encode($value);
                }
            }
        })
        ->implode(@$params['delimiter'] ?: '');
});

\Illuminate\Support\Collection::macro('firstLevelToArray', function () {
    return $this->items;
});