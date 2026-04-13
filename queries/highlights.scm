; Keywords
[
  "interface"
  "router"
  "vlan"
  "ip"
  "ipv6"
  "hostname"
  "no"
  "shutdown"
  "description"
] @keyword

; Commands and sub-commands
(command_name) @function
(sub_command) @function.method

; Parameters and Values
(parameter) @parameter
(value) @string
(number) @number

; Networks and IPs
(ipv4_address) @constant.numeric
(ipv6_address) @constant.numeric
(mask) @constant.numeric

; Comments
(comment) @comment

; Punctuation and Operators
"!" @punctuation.delimiter
"/" @punctuation.delimiter
"." @punctuation.delimiter
