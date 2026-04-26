; Iniezione della grammatica di configurazione nei log operativi
; Quando il parser principale (cisco) incontra un comando show run,
; delega il parsing del blocco di output al parser specialistico (cisco-config).

((ios_exec_segment
    (show_command
      (show_running_config_command
        output: (output_content) @injection.content)))
 (#set! injection.language "cisco-config"))

; Fallback per show run generico se non beccato dalla foglia specifica
((ios_exec_segment
    (show_command
      (generic_show_command
        execution: (generic_output_line) @_cmd
        output: (diagnostic_output) @injection.content)))
 (#match? @_cmd "[Rr]unning-config")
 (#set! injection.language "cisco-config"))
