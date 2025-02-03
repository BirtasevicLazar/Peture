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

            $timeSlot = abs($worker->time_slot);
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
            $workerId = $request->query('worker_id');
            $serviceId = $request->query('service_id');
            $date = $request->query('date') ? Carbon::parse($request->query('date')) : Carbon::today();
            
            $worker = Worker::findOrFail($workerId);
            $service = Service::findOrFail($serviceId);
            
            $schedule = WorkSchedule::where('worker_id', $workerId)
                ->where('is_working', true)
                ->where('day_of_week', $date->dayOfWeek)
                ->first();
                
            if (!$schedule) {
                return response()->json([]);
            }

            // Proveri da li je datum u neradnim danima
            $isOffDay = $worker->offDays()
                ->where('start_date', '<=', $date->format('Y-m-d'))
                ->where('end_date', '>=', $date->format('Y-m-d'))
                ->exists();

            if ($isOffDay) {
                return response()->json([]);
            }

            $timeSlot = abs($worker->time_slot);
            $serviceDuration = $service->trajanje;
            
            try {
                $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->start_time, 0, 5));
                $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->end_time, 0, 5));
            } catch (\Exception $e) {
                return response()->json([]);
            }
            
            $availableSlots = [];
            $currentTime = $startTime->copy();
            
            // Ako je time_slot negativan, koristi trajanje usluge za pomeranje
            $incrementMinutes = $worker->time_slot < 0 ? $serviceDuration : $timeSlot;
            
            while ($currentTime->copy()->addMinutes($serviceDuration) <= $endTime) {
                $slotEndTime = $currentTime->copy()->addMinutes($serviceDuration);
                
                // Proveri da li postoji preklapanje sa postojećim rezervacijama
                $isAvailable = true;
                $checkTime = $currentTime->copy();
                
                // Proveri sve time slotove između početka i kraja usluge
                while ($checkTime < $slotEndTime) {
                    $checkEndTime = $checkTime->copy()->addMinutes($timeSlot);
                    
                    $exists = Appointment::where('worker_id', $workerId)
                        ->where('status', 'booked')
                        ->where(function($query) use ($checkTime, $checkEndTime) {
                            $query->where(function($q) use ($checkTime, $checkEndTime) {
                                $q->where('start_time', '<', $checkEndTime)
                                  ->where('end_time', '>', $checkTime);
                            });
                        })
                        ->exists();
                    
                    if ($exists) {
                        $isAvailable = false;
                        break;
                    }
                    
                    $checkTime->addMinutes($timeSlot);
                }
                
                if ($isAvailable) {
                    // Proveri da li termin prelazi preko pauze
                    if ($schedule->has_break) {
                        $breakStart = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->break_start, 0, 5));
                        $breakEnd = Carbon::parse($date->format('Y-m-d') . ' ' . substr($schedule->break_end, 0, 5));
                        
                        if ($currentTime < $breakEnd && $slotEndTime > $breakStart) {
                            $currentTime = $breakEnd->copy();
                            continue;
                        }
                    }
                    
                    $availableSlots[] = [
                        'id' => uniqid(),
                        'start_time' => $currentTime->format('H:i'),
                        'end_time' => $slotEndTime->format('H:i'),
                        'date' => $currentTime->format('Y-m-d'),
                        'service' => $service->naziv,
                        'duration' => $service->trajanje,
                        'worker' => $worker->ime . ' ' . $worker->prezime,
                        'price' => $service->cena
                    ];
                }
                
                // Pomeri vreme za odgovarajući interval
                $currentTime->addMinutes($incrementMinutes);
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
            
            // Proveri da li je datum u neradnim danima
            $isOffDay = $worker->offDays()
                ->where('start_date', '<=', $startTime->format('Y-m-d'))
                ->where('end_date', '>=', $startTime->format('Y-m-d'))
                ->exists();

            if ($isOffDay) {
                return response()->json([
                    'message' => 'Izabrani datum je neradan dan'
                ], 422);
            }

            // Proveri da li je termin već zauzet za celo trajanje usluge
            $timeSlot = abs($worker->time_slot);
            $requiredSlots = ceil($service->trajanje / $timeSlot);
            
            $isAvailable = true;
            $checkTime = $startTime->copy();
            
            for ($i = 0; $i < $requiredSlots; $i++) {
                $checkEndTime = $checkTime->copy()->addMinutes($timeSlot);
                
                $exists = Appointment::where('worker_id', $validated['worker_id'])
                    ->where('status', 'booked')
                    ->where(function($query) use ($checkTime, $checkEndTime) {
                        $query->where(function($q) use ($checkTime, $checkEndTime) {
                            $q->where('start_time', '<', $checkEndTime)
                              ->where('end_time', '>', $checkTime);
                        });
                    })
                    ->exists();
                
                if ($exists) {
                    $isAvailable = false;
                    break;
                }
                
                $checkTime->addMinutes($timeSlot);
            }

            if (!$isAvailable) {
                return response()->json([
                    'message' => 'Termin je već zauzet'
                ], 400);
            }

            // Kreiraj jedan appointment za celo trajanje usluge
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

    public function getWorkerAppointments(Request $request, $workerId)
    {
        try {
            // Dohvati radnika sa njegovim uslugama
            $worker = Worker::with(['services', 'offDays'])->findOrFail($workerId);
            
            // Dohvati datum iz query parametra ili koristi današnji datum
            $date = $request->query('date') ? Carbon::parse($request->query('date')) : Carbon::today();
            
            // Proveri da li je datum neradan dan
            $isOffDay = $worker->offDays()
                ->where('start_date', '<=', $date->format('Y-m-d'))
                ->where('end_date', '>=', $date->format('Y-m-d'))
                ->exists();

            if ($isOffDay) {
                return response()->json([
                    'worker' => [
                        'id' => $worker->id,
                        'ime' => $worker->ime,
                        'prezime' => $worker->prezime,
                        'time_slot' => abs($worker->time_slot),
                        'services' => $worker->services->map(function($service) {
                            return [
                                'id' => $service->id,
                                'naziv' => $service->naziv,
                                'trajanje' => $service->trajanje,
                                'cena' => $service->cena
                            ];
                        })
                    ],
                    'schedule' => null,
                    'appointments' => [],
                    'date' => $date->format('Y-m-d'),
                    'is_off_day' => true,
                    'off_day' => $worker->offDays()
                        ->where('start_date', '<=', $date->format('Y-m-d'))
                        ->where('end_date', '>=', $date->format('Y-m-d'))
                        ->first()
                ]);
            }
            
            // Dohvati raspored za taj dan
            $schedule = WorkSchedule::where('worker_id', $workerId)
                ->where('day_of_week', $date->dayOfWeek)
                ->first();
            
            // Dohvati termine za taj dan
            $appointments = Appointment::where('worker_id', $workerId)
                ->where('status', 'booked')
                ->whereDate('start_time', $date)
                ->with(['service'])
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function ($appointment) {
                    $duration = null;
                    $serviceName = null;

                    if ($appointment->service) {
                        $duration = $appointment->service->trajanje;
                        $serviceName = $appointment->service->naziv;
                    } else {
                        $duration = $appointment->custom_service_duration;
                        $serviceName = $appointment->custom_service_name ?: 'Termin bez usluge';
                    }

                    return [
                        'id' => $appointment->id,
                        'start_time' => Carbon::parse($appointment->start_time)->format('H:i'),
                        'end_time' => Carbon::parse($appointment->end_time)->format('H:i'),
                        'service_name' => $serviceName,
                        'service_duration' => $duration,
                        'service_price' => $appointment->service ? $appointment->service->cena : $appointment->custom_service_price,
                        'is_custom_service' => !$appointment->service,
                        'customer_name' => $appointment->customer_name,
                        'customer_phone' => $appointment->customer_phone,
                        'customer_email' => $appointment->customer_email ?: null,
                        'status' => $appointment->status
                    ];
                });

            return response()->json([
                'worker' => [
                    'id' => $worker->id,
                    'ime' => $worker->ime,
                    'prezime' => $worker->prezime,
                    'time_slot' => abs($worker->time_slot),
                    'services' => $worker->services->map(function($service) {
                        return [
                            'id' => $service->id,
                            'naziv' => $service->naziv,
                            'trajanje' => $service->trajanje,
                            'cena' => $service->cena
                        ];
                    })
                ],
                'schedule' => $schedule ? [
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'has_break' => $schedule->has_break,
                    'break_start' => $schedule->break_start,
                    'break_end' => $schedule->break_end,
                    'is_working' => $schedule->is_working
                ] : null,
                'appointments' => $appointments,
                'date' => $date->format('Y-m-d'),
                'is_off_day' => false
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching appointments:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Greška prilikom dohvatanja termina',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createWorkerAppointment(Request $request)
    {
        try {
            \Log::info('Creating worker appointment:', [
                'request_data' => $request->all()
            ]);

            $validated = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'service_id' => 'nullable|exists:services,id',
                'custom_service_name' => 'required_without:service_id|string|nullable',
                'custom_service_duration' => 'required_without:service_id|integer|min:1|nullable',
                'custom_service_price' => 'nullable|numeric|min:0',
                'start_time' => 'required|date_format:Y-m-d H:i',
                'customer_name' => 'required|string',
                'customer_phone' => 'required|string',
                'customer_email' => 'nullable|email'
            ]);

            \Log::info('Validated data:', [
                'validated' => $validated
            ]);

            $worker = Worker::findOrFail($validated['worker_id']);
            
            // Odredi trajanje termina
            if (!empty($validated['service_id'])) {
                $service = Service::findOrFail($validated['service_id']);
                $duration = $service->trajanje;
                \Log::info('Using service duration:', ['duration' => $duration]);
            } else {
                $duration = $validated['custom_service_duration'];
                \Log::info('Using custom duration:', ['duration' => $duration]);
            }
            
            $startTime = Carbon::parse($validated['start_time']);
            $endTime = $startTime->copy()->addMinutes($duration);
            
            \Log::info('Appointment time:', [
                'start_time' => $startTime->format('Y-m-d H:i'),
                'end_time' => $endTime->format('Y-m-d H:i')
            ]);

            // Proveri da li je termin već zauzet
            $exists = Appointment::where('worker_id', $validated['worker_id'])
                ->where('status', 'booked')
                ->where(function($query) use ($startTime, $endTime) {
                    $query->where(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    });
                })
                ->exists();
            
            if ($exists) {
                \Log::warning('Appointment overlap detected');
                return response()->json([
                    'message' => 'Termin je već zauzet'
                ], 400);
            }

            // Proveri da li termin prelazi radno vreme
            $schedule = WorkSchedule::where('worker_id', $validated['worker_id'])
                ->where('day_of_week', $startTime->dayOfWeek)
                ->first();

            if (!$schedule || !$schedule->is_working) {
                \Log::warning('Worker not working:', [
                    'schedule' => $schedule,
                    'day_of_week' => $startTime->dayOfWeek
                ]);
                return response()->json([
                    'message' => 'Radnik ne radi u izabrano vreme'
                ], 400);
            }

            $workStart = Carbon::parse($startTime->format('Y-m-d') . ' ' . $schedule->start_time);
            $workEnd = Carbon::parse($startTime->format('Y-m-d') . ' ' . $schedule->end_time);

            if ($startTime < $workStart || $endTime > $workEnd) {
                \Log::warning('Appointment outside working hours:', [
                    'start_time' => $startTime->format('Y-m-d H:i'),
                    'end_time' => $endTime->format('Y-m-d H:i'),
                    'work_start' => $workStart->format('Y-m-d H:i'),
                    'work_end' => $workEnd->format('Y-m-d H:i')
                ]);
                return response()->json([
                    'message' => 'Termin mora biti unutar radnog vremena'
                ], 400);
            }

            // Proveri pauzu ako postoji
            if ($schedule->has_break) {
                $breakStart = Carbon::parse($startTime->format('Y-m-d') . ' ' . $schedule->break_start);
                $breakEnd = Carbon::parse($startTime->format('Y-m-d') . ' ' . $schedule->break_end);

                if ($startTime < $breakEnd && $endTime > $breakStart) {
                    \Log::warning('Appointment overlaps with break:', [
                        'start_time' => $startTime->format('Y-m-d H:i'),
                        'end_time' => $endTime->format('Y-m-d H:i'),
                        'break_start' => $breakStart->format('Y-m-d H:i'),
                        'break_end' => $breakEnd->format('Y-m-d H:i')
                    ]);
                    return response()->json([
                        'message' => 'Termin se preklapa sa pauzom'
                    ], 400);
                }
            }

            try {
                $appointmentData = [
                    'user_id' => $worker->user_id,
                    'worker_id' => $validated['worker_id'],
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'customer_name' => $validated['customer_name'],
                    'customer_phone' => $validated['customer_phone'],
                    'customer_email' => $validated['customer_email'] ?? null,
                    'status' => 'booked'
                ];

                if (!empty($validated['service_id'])) {
                    $appointmentData['service_id'] = $validated['service_id'];
                } else {
                    $appointmentData['custom_service_name'] = $validated['custom_service_name'];
                    $appointmentData['custom_service_duration'] = $validated['custom_service_duration'];
                    $appointmentData['custom_service_price'] = $validated['custom_service_price'] ?? 0;
                }

                $appointment = Appointment::create($appointmentData);

                \Log::info('Appointment created successfully:', [
                    'appointment_id' => $appointment->id
                ]);

                return response()->json([
                    'message' => 'Termin uspešno kreiran',
                    'appointment' => $appointment
                ]);
            } catch (\Exception $e) {
                \Log::error('Error creating appointment record:', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
            
        } catch (\Exception $e) {
            \Log::error('Error in createWorkerAppointment:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Greška prilikom kreiranja termina',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAvailableSlots(Request $request)
    {
        $request->validate([
            'worker_id' => 'required|exists:workers,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $worker = Worker::findOrFail($request->worker_id);
        
        // Provera da li je traženi datum unutar dozvoljenog perioda
        $maxDate = now()->addDays($worker->booking_window);
        $requestDate = Carbon::parse($request->date);
        
        if ($requestDate->gt($maxDate)) {
            return response()->json([
                'message' => 'Datum je izvan dozvoljenog perioda za zakazivanje',
                'available_slots' => []
            ], 400);
        }

        // Ostatak postojeće logike za pronalaženje slobodnih termina
        // ... existing code ...
    }

    public function getAvailableDates(Request $request)
    {
        $request->validate([
            'worker_id' => 'required|exists:workers,id',
        ]);

        $worker = Worker::findOrFail($request->worker_id);
        
        // Uzimamo u obzir booking_window radnika
        $startDate = now();
        $endDate = now()->addDays($worker->booking_window);
        
        $availableDates = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            if (!$currentDate->isPast()) {
                $availableDates[] = $currentDate->format('Y-m-d');
            }
            $currentDate->addDay();
        }

        return response()->json([
            'available_dates' => $availableDates
        ]);
    }
} 