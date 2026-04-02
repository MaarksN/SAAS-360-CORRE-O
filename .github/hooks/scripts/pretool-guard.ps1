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

$commandText = ""
if ($payload.toolInput -and $payload.toolInput.command) { $commandText = [string]$payload.toolInput.command }
elseif ($payload.parameters -and $payload.parameters.command) { $commandText = [string]$payload.parameters.command }

$destructivePattern = '(?i)\b(rm\s+-rf|remove-item\s+.*-recurse\s+.*-force|rmdir\s+/s\s+/q|del\s+/[sq]|format\b|mkfs\b|dd\s+if=|shutdown\b|reboot\b|git\s+reset\s+--hard|git\s+checkout\s+--)'
$isSensitiveTool = $toolName -in @('run_in_terminal', 'execute', 'create_and_run_task', 'shell_command')

if ($isSensitiveTool -and [string]::IsNullOrWhiteSpace($commandText)) {
    $out = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'ask'
            permissionDecisionReason = 'Permissao ambigua para ferramenta sensivel sem comando explicito; requer confirmacao.'
        }
    }
    ($out | ConvertTo-Json -Depth 10 -Compress) | Write-Output
    exit 0
}

if ($isSensitiveTool -and $commandText -match $destructivePattern) {
    $out = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'ask'
            permissionDecisionReason = 'Comando potencialmente destrutivo detectado; requer confirmação explícita.'
        }
    }
    ($out | ConvertTo-Json -Depth 10 -Compress) | Write-Output
    exit 0
}

$allow = @{
    hookSpecificOutput = @{
        hookEventName = 'PreToolUse'
        permissionDecision = 'allow'
        permissionDecisionReason = 'Nenhum risco destrutivo detectado.'
    }
}
($allow | ConvertTo-Json -Depth 10 -Compress) | Write-Output
exit 0
