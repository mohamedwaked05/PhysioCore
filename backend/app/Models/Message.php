<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'context',
        'reference_id',
        'content',
        'is_read',
        'delivered_at',
        'seen_at',
    ];

    protected $casts = [
        'is_read'      => 'boolean',
        'delivered_at' => 'datetime',
        'seen_at'      => 'datetime',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
