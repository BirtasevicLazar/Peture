<?php

namespace App\Http\Kernel;

class Kernel extends HttpKernel
{
    // ...existing code...
    
    protected $middlewareGroups = [
        // ...existing code...
        
        'api' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];
    
    // ...existing code...
}
