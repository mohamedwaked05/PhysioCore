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
            'content'      => ['nullable', 'string', 'max:2000'],
            'image_url'    => ['nullable', 'string', 'max:5000000'], // base64 data URI
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $content = $this->input('content');
            $image   = $this->input('image_url');
            if (empty(trim((string) $content)) && empty($image)) {
                $v->errors()->add('content', 'A message or image is required.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'receiver_id.exists'    => 'The recipient does not exist.',
            'receiver_id.different' => 'You cannot message yourself.',
            'context.in'            => 'Invalid message context.',
        ];
    }
}
