<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class SecurityAudit
{
    public static function record(
        Request $request,
        string $event,
        string $result = 'success',
        ?User $actor = null,
        ?string $resourceType = null,
        $resourceId = null,
        array $metadata = []
    ): void {
        try {
            AuditLog::create([
                'user_id' => ($actor ?: $request->user())?->id,
                'event' => $event,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId === null ? null : (string) $resourceId,
                'result' => $result,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
                'metadata' => array_merge([
                    'request_id' => $request->headers->get('X-Request-ID') ?: (string) Str::uuid(),
                    'method' => $request->method(),
                    'path' => $request->path(),
                ], $metadata),
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    public static function changes(array $before, array $after, array $allowedKeys): array
    {
        $old = array_intersect_key($before, array_flip($allowedKeys));
        $new = array_intersect_key($after, array_flip($allowedKeys));

        return [
            'before' => $old,
            'after' => $new,
            'changed_fields' => array_values(array_keys(array_diff_assoc($new, $old))),
        ];
    }
}
