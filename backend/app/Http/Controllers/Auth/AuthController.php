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
                ],
                'salon_name' => 'nullable|string|max:100',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'phone' => 'nullable|string|max:20'
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
                'password.regex' => 'Lozinka mora sadržati najmanje jedno veliko slovo, jedno malo slovo, jedan broj i jedan specijalni karakter',
                'salon_name.max' => 'Ime salona ne može biti duže od 100 karaktera',
                'address.max' => 'Adresa ne može biti duža od 255 karaktera',
                'city.max' => 'Grad ne može biti duži od 100 karaktera',
                'phone.max' => 'Broj telefona ne može biti duži od 20 karaktera'
            ]);

            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'salon_name' => $validatedData['salon_name'] ?? null,
                'address' => $validatedData['address'] ?? null,
                'city' => $validatedData['city'] ?? null,
                'phone' => $validatedData['phone'] ?? null,
                'is_active' => true,
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
            ]);

            $user = User::where('email', $validatedData['email'])->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Pogrešni podaci za prijavu'
                ], 401);
            }

            $token = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'user' => $user,
                'access_token' => $token
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Došlo je do greške prilikom prijave',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = $request->user();
            
            $validatedData = $request->validate([
                'salon_name' => 'nullable|string|max:100',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'phone' => 'nullable|string|max:20',
                'email' => 'required|email|unique:users,email,' . $user->id,
            ], [
                'salon_name.max' => 'Ime salona ne može biti duže od 100 karaktera',
                'address.max' => 'Adresa ne može biti duža od 255 karaktera',
                'city.max' => 'Grad ne može biti duži od 100 karaktera',
                'phone.max' => 'Broj telefona ne može biti duži od 20 karaktera',
                'email.required' => 'Email adresa je obavezna',
                'email.email' => 'Uneta email adresa nije validna',
                'email.unique' => 'Ova email adresa je već registrovana',
            ]);

            $user->update($validatedData);

            return response()->json([
                'message' => 'Podaci uspešno ažurirani',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'message' => 'Greška u validaciji',
                    'errors' => $e->errors()
                ], 422);
            }
            
            return response()->json([
                'message' => 'Došlo je do greške prilikom ažuriranja podataka',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
