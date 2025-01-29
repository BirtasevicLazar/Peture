<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Appointment;
use Illuminate\Support\Facades\Storage;

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
        $request->validate([
            'ime' => 'required|string|max:255',
            'prezime' => 'required|string|max:255',
            'email' => 'required|email|unique:workers,email',
            'telefon' => 'nullable|string|max:255',
            'time_slot' => 'required|integer',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $data = $request->only(['ime', 'prezime', 'email', 'telefon', 'time_slot']);
        $data['user_id'] = Auth::id();

        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('worker-images', 'public');
            $data['profile_image'] = $path;
        }

        $worker = Worker::create($data);

        return response()->json([
            'message' => 'Radnik uspešno kreiran',
            'worker' => $worker
        ], 201);
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

    public function update(Request $request, $id)
    {
        $request->validate([
            'ime' => 'required|string|max:255',
            'prezime' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telefon' => 'nullable|string|max:255',
            'time_slot' => 'nullable|integer',
            'booking_window' => 'required|integer|min:1|max:90',
            'profile_image' => 'nullable|image|max:2048'
        ]);

        $worker = Worker::findOrFail($id);
        
        $data = $request->only(['ime', 'prezime', 'email', 'telefon', 'time_slot', 'booking_window']);
        
        if ($request->hasFile('profile_image')) {
            // Obriši staru sliku ako postoji
            if ($worker->profile_image) {
                Storage::disk('public')->delete($worker->profile_image);
            }

            // Upload nove slike
            $path = $request->file('profile_image')->store('worker-images', 'public');
            $data['profile_image'] = $path;
        }

        $worker->update($data);

        return response()->json(['worker' => $worker]);
    }

    public function destroy(Worker $worker)
    {
        if ($worker->profile_image) {
            Storage::disk('public')->delete($worker->profile_image);
        }
        
        $worker->delete();
        
        return response()->json(['message' => 'Radnik uspešno obrisan']);
    }
}
