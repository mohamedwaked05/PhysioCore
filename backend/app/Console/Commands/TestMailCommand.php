<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMailCommand extends Command
{
    protected $signature = 'mail:test {email}';
    protected $description = 'Send a test email to verify mail config';

    public function handle(): int
    {
        $to = $this->argument('email');
        $this->info("Sending via " . config('mail.default') . ' from ' . config('mail.from.address'));
        try {
            Mail::raw('PhysioCore email delivery test. If you receive this, mail is working.', function ($m) use ($to) {
                $m->to($to)->subject('PhysioCore Mail Test');
            });
            $this->info('SUCCESS');
            return 0;
        } catch (\Exception $e) {
            $this->error('FAILED: ' . $e->getMessage());
            return 1;
        }
    }
}
