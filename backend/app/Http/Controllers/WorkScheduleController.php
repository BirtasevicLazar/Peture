<?php

namespace App\Http\Controllers;

use App\Models\WorkSchedule;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkScheduleController extends Controller
{
    public function index()
    {
        try {
            $worker = Worker::where('user_id', Auth::id())->first();
            
            if (!$worker) {
                return response()->json(['message' => 'Radnik nije pronađen'], 404);
            }

            $schedule = WorkSchedule::where('worker_id', $worker->id)->get();
            return response()->json($schedule);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Greška pri dohvatanju rasporeda'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $worker = Worker::where('user_id', Auth::id())->first();
            
            if (!$worker) {
                return response()->json(['message' => 'Radnik nije pronađen'], 404);
            }

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
            $worker = Worker::where('user_id', Auth::id())->first();
            
            if (!$worker || $workSchedule->worker_id !== $worker->id) {
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