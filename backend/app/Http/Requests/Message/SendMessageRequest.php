<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'receiver_id'  => ['required', 'integer', 'exists:users,id', 'different:' . $this->user()->id],
            'context'      => ['required', 'string', 'in:inquiry,treatment,feedback'],
            'reference_id' => ['nullable', 'integer'],
            'content'      => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'receiver_id.exists'    => 'The recipient does not exist.',
            'receiver_id.different' => 'You cannot message yourself.',
            'context.in'            => 'Invalid message context.',
            'content.required'      => 'Message content is required.',
            'content.max'           => 'Message cannot exceed 2000 characters.',
        ];
    }
}
