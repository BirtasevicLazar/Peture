<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|max:55|regex:/^[a-zA-Z\s]+$/',
                'email' => 'required|email|unique:users',
                'password' => [
                    'required',
                    'confirmed',
                    'min:8',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/'
                ]
            ], [
                'name.required' => 'Ime i prezime je obavezno',
                'name.max' => 'Ime i prezime ne može biti duže od 55 karaktera',
                'name.regex' => 'Ime i prezime može sadržati samo slova',
                'email.required' => 'Email adresa je obavezna',
                'email.email' => 'Uneta email adresa nije validna',
                'email.unique' => 'Ova email adresa je već registrovana',
                'password.required' => 'Lozinka je obavezna',
                'password.confirmed' => 'Lozinke se ne poklapaju',
                'password.min' => 'Lozinka mora imati najmanje 8 karaktera',
                'password.regex' => 'Lozinka mora sadržati najmanje jedno veliko slovo, jedno malo slovo, jedan broj i jedan specijalni karakter'
            ]);

            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'remember_token' => Str::random(10)
            ]);

            $accessToken = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'user' => $user,
                'access_token' => $accessToken
            ], 201);

        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'message' => 'Greška u validaciji',
                    'errors' => $e->errors()
                ], 422);
            }
            
            return response()->json([
                'message' => 'Došlo je do greške prilikom registracije',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ], [
                'email.required' => 'Email adresa je obavezna',
                'email.email' => 'Uneta email adresa nije validna',
                'password.required' => 'Lozinka je obavezna'
            ]);

            $user = User::where('email', $validatedData['email'])->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Korisnik sa ovom email adresom ne postoji'
                ], 401);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Pogrešna lozinka'
                ], 401);
            }

            $accessToken = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'user' => $user,
                'access_token' => $accessToken
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Došlo je do greške prilikom prijave',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
