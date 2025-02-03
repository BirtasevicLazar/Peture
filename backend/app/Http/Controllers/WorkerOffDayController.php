<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\WorkerOffDay;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class WorkerOffDayController extends Controller
{
    public function index($workerId)
    {
        $worker = Worker::findOrFail($workerId);
        $offDays = $worker->offDays()->orderBy('start_date')->get();
        
        return response()->json(['off_days' => $offDays]);
    }

    public function store(Request $request, $workerId)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string'
        ]);

        $worker = Worker::findOrFail($workerId);
        
        // Provera da li postoje zakazani termini u izabranom periodu
        $hasAppointments = Appointment::where('worker_id', $workerId)
            ->where(function($query) use ($request) {
                $query->whereDate('start_time', '>=', $request->start_date)
                      ->whereDate('start_time', '<=', $request->end_date);
            })
            ->exists();
            
        if ($hasAppointments) {
            return response()->json([
                'message' => 'Ne možete postaviti neradne dane jer imate zakazane termine u tom periodu'
            ], 422);
        }

        $offDay = $worker->offDays()->create([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason
        ]);

        return response()->json([
            'message' => 'Neradni dani su uspešno dodati',
            'off_day' => $offDay
        ]);
    }

    public function destroy($workerId, $offDayId)
    {
        $worker = Worker::findOrFail($workerId);
        $offDay = $worker->offDays()->findOrFail($offDayId);
        
        $offDay->delete();

        return response()->json([
            'message' => 'Neradni dani su uspešno obrisani'
        ]);
    }
}
