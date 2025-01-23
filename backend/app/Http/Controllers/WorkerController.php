<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkerController extends Controller
{
    public function index()
    {
        try {
            $workers = Worker::where('user_id', Auth::id())->get();
            return response()->json($workers);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dohvatanja radnika',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'ime' => 'required|string|max:100',
                'prezime' => 'required|string|max:100',
                'email' => 'required|email|unique:workers,email',
                'telefon' => 'required|string|max:20',
                'time_slot' => 'required|integer|in:-60,-30,-20,-15,-10,10,15,20,30,60'
            ]);

            $worker = Worker::create([
                'user_id' => Auth::id(),
                'ime' => $validatedData['ime'],
                'prezime' => $validatedData['prezime'],
                'email' => $validatedData['email'],
                'telefon' => $validatedData['telefon'],
                'time_slot' => $validatedData['time_slot']
            ]);

            return response()->json([
                'message' => 'Radnik uspešno dodat',
                'worker' => $worker
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dodavanja radnika',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $worker = Worker::with(['services', 'schedules'])->findOrFail($id);
            
            if ($worker->user_id !== auth()->id()) {
                return response()->json([
                    'message' => 'Nemate pristup ovom radniku'
                ], 403);
            }
            
            return response()->json($worker);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dohvatanja radnika',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Worker $worker)
    {
        try {
            if ($worker->user_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Nemate dozvolu za izmenu ovog radnika'
                ], 403);
            }

            $validatedData = $request->validate([
                'ime' => 'required|string|max:100',
                'prezime' => 'required|string|max:100',
                'email' => 'required|email|unique:workers,email,' . $worker->id,
                'telefon' => 'required|string|max:20',
                'time_slot' => 'required|integer|in:-60,-30,-20,-15,-10,10,15,20,30,60'
            ]);

            // Proveri da li radnik ima usluge
            if ($worker->services()->exists()) {
                $newTimeSlot = abs($validatedData['time_slot']);
                $services = $worker->services()->get();
                
                // Proveri kompatibilnost sa svim uslugama
                $incompatibleServices = [];
                foreach ($services as $service) {
                    // Proveri da li je trajanje usluge deljivo sa novim time slotom
                    // ILI da li je novi time slot deljiv sa trajanjem usluge
                    if (!($service->trajanje % $newTimeSlot === 0 || $newTimeSlot % $service->trajanje === 0)) {
                        $incompatibleServices[] = [
                            'naziv' => $service->naziv,
                            'trajanje' => $service->trajanje
                        ];
                    }
                }
                
                if (!empty($incompatibleServices)) {
                    $serviceList = collect($incompatibleServices)
                        ->map(function($service) {
                            return "{$service['naziv']} ({$service['trajanje']} min)";
                        })
                        ->join(', ');
                        
                    return response()->json([
                        'message' => "Ne možete promeniti na {$newTimeSlot} minuta jer nije kompatibilno sa trajanjem sledećih usluga: {$serviceList}",
                        'errors' => [
                            'time_slot' => ["Nije kompatibilno sa uslugama: {$serviceList}"]
                        ]
                    ], 422);
                }
            }

            $worker->update($validatedData);

            return response()->json([
                'message' => 'Radnik uspešno ažuriran',
                'worker' => $worker
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom ažuriranja radnika',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Worker $worker)
    {
        try {
            if ($worker->user_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Nemate dozvolu za brisanje ovog radnika'
                ], 403);
            }

            $worker->delete();

            return response()->json([
                'message' => 'Radnik uspešno obrisan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom brisanja radnika',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
