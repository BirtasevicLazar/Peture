<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Dodajemo polja za proizvoljnu uslugu
            $table->string('custom_service_name')->nullable()->after('service_id');
            $table->integer('custom_service_duration')->nullable()->after('custom_service_name');
            $table->decimal('custom_service_price', 10, 2)->nullable()->after('custom_service_duration');
            
            // Menjamo service_id da bude nullable
            $table->unsignedBigInteger('service_id')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['custom_service_name', 'custom_service_duration', 'custom_service_price']);
            $table->unsignedBigInteger('service_id')->nullable(false)->change();
        });
    }
}; 