<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $workerId = $request->query('worker_id');
        $services = Service::where('user_id', Auth::id())
            ->when($workerId, function($query) use ($workerId) {
                return $query->where('worker_id', $workerId);
            })
            ->get();
            
        return response()->json($services);
    }

    public function store(Request $request)
    {
        try {
            // Prvo pronađi radnika da bismo mogli koristiti njegov time_slot u validaciji
            $worker = Worker::where('id', $request->worker_id)
                          ->where('user_id', Auth::id())
                          ->first();

            if (!$worker) {
                return response()->json([
                    'message' => 'Unauthorized worker access'
                ], 403);
            }

            $validated = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'naziv' => 'required|string|max:255',
                'opis' => 'nullable|string',
                'cena' => 'required|numeric|min:0',
                'trajanje' => [
                    'required',
                    'integer',
                    'min:' . $worker->time_slot,
                    function ($attribute, $value, $fail) use ($worker) {
                        if ($value % $worker->time_slot !== 0) {
                            $fail("Trajanje usluge mora biti deljivo sa vremenskim slotom radnika (" . $worker->time_slot . " minuta)");
                        }
                    }
                ]
            ]);

            $service = new Service($validated);
            $service->user_id = Auth::id();
            $service->save();

            return response()->json($service, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Greška prilikom validacije',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dodavanja usluge',
                'errors' => ['general' => [$e->getMessage()]]
            ], 500);
        }
    }

    public function update(Request $request, Service $service)
    {
        try {
            if ($service->user_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Dohvati radnika za validaciju
            $worker = Worker::where('id', $service->worker_id)
                          ->where('user_id', Auth::id())
                          ->first();

            if (!$worker) {
                return response()->json([
                    'message' => 'Unauthorized worker access'
                ], 403);
            }

            $validated = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'naziv' => 'required|string|max:255',
                'opis' => 'nullable|string',
                'cena' => 'required|numeric|min:0',
                'trajanje' => [
                    'required',
                    'integer',
                    'min:' . $worker->time_slot,
                    function ($attribute, $value, $fail) use ($worker) {
                        if ($value % $worker->time_slot !== 0) {
                            $fail("Trajanje usluge mora biti deljivo sa vremenskim slotom radnika (" . $worker->time_slot . " minuta)");
                        }
                    }
                ]
            ]);

            // Proveri da li je worker_id promenjen i da li novi radnik pripada istom salonu
            if ($validated['worker_id'] !== $service->worker_id) {
                $newWorker = Worker::where('id', $validated['worker_id'])
                                 ->where('user_id', Auth::id())
                                 ->first();

                if (!$newWorker) {
                    return response()->json([
                        'message' => 'Unauthorized worker access'
                    ], 403);
                }

                // Proveri da li trajanje odgovara time_slot-u novog radnika
                if ($validated['trajanje'] % $newWorker->time_slot !== 0) {
                    return response()->json([
                        'message' => 'Greška prilikom validacije',
                        'errors' => [
                            'trajanje' => ["Trajanje usluge mora biti deljivo sa vremenskim slotom novog radnika (" . $newWorker->time_slot . " minuta)"]
                        ]
                    ], 422);
                }
            }

            $service->update($validated);

            return response()->json($service);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Greška prilikom validacije',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom ažuriranja usluge',
                'errors' => ['general' => [$e->getMessage()]]
            ], 500);
        }
    }

    public function destroy(Service $service)
    {
        if ($service->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $service->delete();
        return response()->json(['message' => 'Service deleted']);
    }
}
