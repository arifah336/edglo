<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'EdGLO Backend API',
        'version' => 'v1',
        'status' => 'ready',
        'api' => url('/api/v1'),
        'health' => url('/up'),
    ]);
});
