<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\WorkSchedule;
use App\Models\Service;
use App\Models\Worker;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function generateAppointments(Request $request)
    {
        try {
            $workerId = $request->worker_id;
            $serviceId = $request->service_id;
            
            $worker = Worker::findOrFail($workerId);
            $service = Service::findOrFail($serviceId);
            
            $schedule = WorkSchedule::where('worker_id', $workerId)
                                  ->where('is_working', true)
                                  ->get();
            
            if ($schedule->isEmpty()) {
                return response()->json([
                    'message' => 'Radnik nema definisano radno vreme'
                ], 400);
            }

            $timeSlot = $worker->time_slot;
            $serviceDuration = $service->trajanje;
            
            $availableSlots = [];
            $startDate = Carbon::today();
            $endDate = Carbon::today()->addDays(14);
            
            for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
                $dayOfWeek = $date->dayOfWeek;
                $daySchedule = $schedule->firstWhere('day_of_week', $dayOfWeek);
                
                if (!$daySchedule) continue;
                
                try {
                    $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($daySchedule->start_time, 0, 5));
                    $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($daySchedule->end_time, 0, 5));
                } catch (\Exception $e) {
                    continue;
                }
                
                $currentTime = $startTime->copy();
                
                while ($currentTime->copy()->addMinutes($timeSlot) <= $endTime) {
                    $slotEndTime = $currentTime->copy()->addMinutes($serviceDuration);
                    
                    // Proveri da li postoji preklapanje sa postojećim rezervacijama
                    $exists = Appointment::where('worker_id', $workerId)
                        ->where('status', 'booked')
                        ->where(function($query) use ($currentTime, $slotEndTime) {
                            $query->where(function($q) use ($currentTime, $slotEndTime) {
                                $q->where('start_time', '<=', $slotEndTime)
                                  ->where('end_time', '>', $currentTime);
                            });
                        })
                        ->exists();
                    
                    if (!$exists) {
                        $availableSlots[] = [
                            'start_time' => $currentTime->format('H:i'),
                            'end_time' => $slotEndTime->format('H:i'),
                            'date' => $currentTime->format('Y-m-d'),
                            'service' => $service->naziv,
                            'duration' => $service->trajanje,
                            'worker' => $worker->ime . ' ' . $worker->prezime
                        ];
                    }
                    
                    $currentTime->addMinutes($timeSlot);
                }
            }
            
            return response()->json($availableSlots);
            
        } catch (\Exception $e) {
            \Log::error('Error in generateAppointments:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'message' => 'Greška prilikom generisanja termina',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAvailableAppointments(Request $request)
    {
        try {
            $workerId = $request->worker_id;
            $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
            
            $worker = Worker::findOrFail($workerId);
            $service = Service::where('worker_id', $workerId)->first();
            
            if (!$service) {
                return response()->json([
                    'message' => 'Radnik nema definisane usluge'
                ], 400);
            }
            
            $schedule = WorkSchedule::where('worker_id', $workerId)
                ->where('is_working', true)
                ->where('day_of_week', $date->dayOfWeek)
                ->first();
                
            if (!$schedule) {
                return response()->json([]);
            }

            $timeSlot = $worker->time_slot;
            $serviceDuration = $service->trajanje;
            
            try {
                $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->start_time, 0, 5));
                $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->end_time, 0, 5));
            } catch (\Exception $e) {
                return response()->json([]);
            }
            
            $availableSlots = [];
            $currentTime = $startTime->copy();
            
            while ($currentTime->copy()->addMinutes($timeSlot) <= $endTime) {
                $slotEndTime = $currentTime->copy()->addMinutes($serviceDuration);
                
                // Proveri da li postoji preklapanje sa postojećim rezervacijama
                $exists = Appointment::where('worker_id', $workerId)
                    ->where('status', 'booked')
                    ->where(function($query) use ($currentTime, $slotEndTime) {
                        $query->where(function($q) use ($currentTime, $slotEndTime) {
                            $q->where('start_time', '<=', $slotEndTime)
                              ->where('end_time', '>', $currentTime);
                        });
                    })
                    ->exists();
                
                if (!$exists) {
                    $availableSlots[] = [
                        'id' => uniqid(), // Generišemo jedinstveni ID za frontend
                        'start_time' => $currentTime->format('H:i'),
                        'end_time' => $slotEndTime->format('H:i'),
                        'date' => $currentTime->format('Y-m-d'),
                        'service' => $service->naziv,
                        'duration' => $service->trajanje,
                        'worker' => $worker->ime . ' ' . $worker->prezime
                    ];
                }
                
                $currentTime->addMinutes($timeSlot);
            }
            
            return response()->json($availableSlots);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dohvatanja termina',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bookAppointment(Request $request)
    {
        try {
            $validated = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'service_id' => 'required|exists:services,id',
                'start_time' => 'required|date_format:Y-m-d H:i',
                'customer_name' => 'required|string',
                'customer_email' => 'required|email',
                'customer_phone' => 'required|string'
            ]);

            $worker = Worker::findOrFail($validated['worker_id']);
            $service = Service::findOrFail($validated['service_id']);
            
            $startTime = Carbon::parse($validated['start_time']);
            $endTime = $startTime->copy()->addMinutes($service->trajanje);

            // Proveri da li je termin već zauzet
            $exists = Appointment::where('worker_id', $validated['worker_id'])
                ->where('status', 'booked')
                ->where(function($query) use ($startTime, $endTime) {
                    $query->where(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $endTime)
                          ->where('end_time', '>', $startTime);
                    });
                })
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Termin je već zauzet'
                ], 400);
            }

            $appointment = Appointment::create([
                'user_id' => $worker->user_id,
                'worker_id' => $validated['worker_id'],
                'service_id' => $validated['service_id'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'],
                'status' => 'booked'
            ]);

            return response()->json([
                'message' => 'Termin uspešno rezervisan',
                'appointment' => $appointment
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Booking error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Greška prilikom rezervacije termina',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 