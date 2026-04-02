$raw = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($raw)) {
    exit 0
}

try {
    $payload = $raw | ConvertFrom-Json -Depth 20
} catch {
    exit 0
}

$toolName = ""
if ($payload.toolName) { $toolName = [string]$payload.toolName }
elseif ($payload.toolInvocation -and $payload.toolInvocation.name) { $toolName = [string]$payload.toolInvocation.name }

$message = ""
if ($toolName -in @('edit_file', 'apply_patch', 'create_file')) {
    $message = 'Customizações alteradas: executar revisão de conformidade (F1-F5) antes de finalizar.'
}

if (-not [string]::IsNullOrWhiteSpace($message)) {
    $out = @{
        systemMessage = $message
    }
    ($out | ConvertTo-Json -Depth 10 -Compress) | Write-Output
}

exit 0
