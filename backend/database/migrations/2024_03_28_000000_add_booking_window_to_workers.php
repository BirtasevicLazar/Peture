<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->integer('booking_window')->default(30); // Default 30 dana unapred
        });
    }

    public function down()
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->dropColumn('booking_window');
        });
    }
}; 