<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\WorkScheduleController;
use App\Http\Controllers\AppointmentController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public booking routes
Route::get('/salon/{slug}', function($slug) {
    $salon = \App\Models\User::where('slug', $slug)->first();
    
    if (!$salon) {
        return response()->json(['message' => 'Salon nije pronađen'], 404);
    }

    return \App\Models\User::with(['workers.services'])->where('slug', $slug)->first();
});

Route::get('/appointments/available', [AppointmentController::class, 'getAvailableAppointments']);
Route::post('/appointments/book', [AppointmentController::class, 'bookAppointment']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user/update', [AuthController::class, 'update']);

    // Workers routes
    Route::get('/workers', [WorkerController::class, 'index']);
    Route::get('/workers/{worker}', [WorkerController::class, 'show']);
    Route::post('/workers', [WorkerController::class, 'store']);
    Route::put('/workers/{worker}', [WorkerController::class, 'update']);
    Route::delete('/workers/{worker}', [WorkerController::class, 'destroy']);

    // Services routes
    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    // Work Schedule routes
    Route::get('/work-schedules', [WorkScheduleController::class, 'index']);
    Route::post('/work-schedules', [WorkScheduleController::class, 'store']);
    Route::put('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'update']);
    Route::delete('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'destroy']);

    // Appointments routes
    Route::get('/worker/{workerId}/appointments', [AppointmentController::class, 'getWorkerAppointments']);
    Route::post('/worker/appointments/create', [AppointmentController::class, 'createWorkerAppointment']);
});
