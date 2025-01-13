<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            $validated = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'naziv' => 'required|string|max:255',
                'opis' => 'nullable|string',
                'cena' => 'required|numeric|min:0',
                'trajanje' => 'required|integer|min:1'
            ]);

            // Verify that the worker belongs to the authenticated user
            $worker = Worker::where('id', $validated['worker_id'])
                          ->where('user_id', Auth::id())
                          ->first();

            if (!$worker) {
                return response()->json([
                    'message' => 'Unauthorized worker access'
                ], 403);
            }

            $service = new Service($validated);
            $service->user_id = Auth::id();
            $service->save();

            return response()->json($service, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dodavanja usluge',
                'errors' => $e->getMessage()
            ], 422);
        }
    }

    public function update(Request $request, Service $service)
    {
        if ($service->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'naziv' => 'required|string|max:255',
            'opis' => 'nullable|string',
            'cena' => 'required|numeric|min:0',
            'trajanje' => 'required|integer|min:1'
        ]);

        $service->update($validated);

        return response()->json($service);
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
