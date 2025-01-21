<?php

namespace App\Http\Controllers;

use App\Models\WorkSchedule;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkScheduleController extends Controller
{
    public function index(Request $request)
    {
        try {
            $workerId = $request->query('worker_id');
            
            if (!$workerId) {
                return response()->json(['message' => 'Worker ID je obavezan'], 400);
            }

            $worker = Worker::where('id', $workerId)
                           ->where('user_id', Auth::id())
                           ->first();
            
            if (!$worker) {
                return response()->json(['message' => 'Radnik nije pronađen'], 404);
            }

            $schedules = WorkSchedule::where('worker_id', $workerId)->get();
            return response()->json($schedules);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Greška pri dohvatanju rasporeda'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'day_of_week' => 'required|integer|between:0,6',
                'is_working' => 'required|boolean',
                'start_time' => 'required',
                'end_time' => 'required',
                'has_break' => 'boolean',
                'break_start' => 'nullable',
                'break_end' => 'nullable'
            ]);

            // Proveri da li radnik pripada trenutno ulogovanom salonu
            $worker = Worker::where('id', $validatedData['worker_id'])
                          ->where('user_id', Auth::id())
                          ->first();
            
            if (!$worker) {
                return response()->json(['message' => 'Nemate dozvolu za kreiranje rasporeda za ovog radnika'], 403);
            }

            // Proveri da li već postoji raspored za taj dan
            $existingSchedule = WorkSchedule::where('worker_id', $validatedData['worker_id'])
                                          ->where('day_of_week', $validatedData['day_of_week'])
                                          ->first();
            
            if ($existingSchedule) {
                return response()->json(['message' => 'Raspored za ovaj dan već postoji'], 400);
            }

            // Format time strings
            $validatedData['start_time'] = date('H:i:s', strtotime($validatedData['start_time']));
            $validatedData['end_time'] = date('H:i:s', strtotime($validatedData['end_time']));
            
            if (!empty($validatedData['break_start'])) {
                $validatedData['break_start'] = date('H:i:s', strtotime($validatedData['break_start']));
            }
            if (!empty($validatedData['break_end'])) {
                $validatedData['break_end'] = date('H:i:s', strtotime($validatedData['break_end']));
            }

            $validatedData['user_id'] = Auth::id();
            $schedule = WorkSchedule::create($validatedData);

            return response()->json([
                'message' => 'Raspored uspešno kreiran',
                'schedule' => $schedule
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška pri kreiranju rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, WorkSchedule $workSchedule)
    {
        try {
            // Proveri da li radnik pripada trenutno ulogovanom salonu
            $worker = Worker::where('id', $workSchedule->worker_id)
                          ->where('user_id', Auth::id())
                          ->first();
            
            if (!$worker) {
                return response()->json(['message' => 'Nemate dozvolu za izmenu ovog rasporeda'], 403);
            }

            $validatedData = $request->validate([
                'is_working' => 'required|boolean',
                'start_time' => 'required',
                'end_time' => 'required',
                'has_break' => 'boolean',
                'break_start' => 'nullable',
                'break_end' => 'nullable'
            ]);

            // Format time strings
            $validatedData['start_time'] = date('H:i:s', strtotime($validatedData['start_time']));
            $validatedData['end_time'] = date('H:i:s', strtotime($validatedData['end_time']));
            
            if (!empty($validatedData['break_start'])) {
                $validatedData['break_start'] = date('H:i:s', strtotime($validatedData['break_start']));
            }
            if (!empty($validatedData['break_end'])) {
                $validatedData['break_end'] = date('H:i:s', strtotime($validatedData['break_end']));
            }

            $workSchedule->update($validatedData);

            return response()->json([
                'message' => 'Raspored uspešno ažuriran',
                'schedule' => $workSchedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška pri ažuriranju rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(WorkSchedule $workSchedule)
    {
        try {
            $worker = Worker::where('user_id', Auth::id())->first();
            
            if (!$worker || $workSchedule->worker_id !== $worker->id) {
                return response()->json(['message' => 'Nemate dozvolu za brisanje ovog rasporeda'], 403);
            }

            $workSchedule->delete();
            return response()->json(['message' => 'Raspored uspešno obrisan']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška pri brisanju rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}