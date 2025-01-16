<?php

namespace App\Http\Controllers;

use App\Models\WorkSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkScheduleController extends Controller
{
    public function index(Request $request)
    {
        try {
            $schedules = WorkSchedule::where('user_id', Auth::id())
                ->when($request->worker_id, function($query, $workerId) {
                    return $query->where('worker_id', $workerId);
                })
                ->get();
            
            return response()->json($schedules);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom dohvatanja rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'worker_id' => 'required|exists:workers,id',
                'day_of_week' => 'required|integer|between:0,6',
                'is_working' => 'required|boolean',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'has_break' => 'required|boolean',
                'break_start' => 'required_if:has_break,true|nullable|date_format:H:i',
                'break_end' => 'required_if:has_break,true|nullable|date_format:H:i|after:break_start'
            ]);

            $validatedData['user_id'] = Auth::id();

            $schedule = WorkSchedule::create($validatedData);

            return response()->json([
                'message' => 'Raspored uspešno kreiran',
                'schedule' => $schedule
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom kreiranja rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, WorkSchedule $workSchedule)
    {
        try {
            if ($workSchedule->user_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Nemate dozvolu za izmenu ovog rasporeda'
                ], 403);
            }

            $validatedData = $request->validate([
                'is_working' => 'required|boolean',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'has_break' => 'required|boolean',
                'break_start' => 'required_if:has_break,true|nullable|date_format:H:i',
                'break_end' => 'required_if:has_break,true|nullable|date_format:H:i|after:break_start'
            ]);

            $workSchedule->update($validatedData);

            return response()->json([
                'message' => 'Raspored uspešno ažuriran',
                'schedule' => $workSchedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom ažuriranja rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(WorkSchedule $workSchedule)
    {
        try {
            if ($workSchedule->user_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Nemate dozvolu za brisanje ovog rasporeda'
                ], 403);
            }

            $workSchedule->delete();

            return response()->json([
                'message' => 'Raspored uspešno obrisan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Greška prilikom brisanja rasporeda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}