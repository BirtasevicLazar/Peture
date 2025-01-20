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
        $validated = $request->validate([
            'ime' => 'required|string|max:255',
            'prezime' => 'required|string|max:255',
            'email' => 'required|email|unique:workers,email',
            'telefon' => 'required|string|max:255'
        ]);

        $validated['user_id'] = auth()->id();
        $worker = Worker::create($validated);

        return response()->json($worker, 201);
    }

    public function update(Request $request, Worker $worker)
    {
        $validated = $request->validate([
            'ime' => 'required|string|max:255',
            'prezime' => 'required|string|max:255',
            'email' => 'required|email|unique:workers,email,' . $worker->id,
            'telefon' => 'required|string|max:255'
        ]);

        $worker->update($validated);
        return response()->json($worker);
    }

    public function destroy(Worker $worker)
    {
        try {
            // Provera da li radnik pripada trenutno ulogovanom salonu
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
