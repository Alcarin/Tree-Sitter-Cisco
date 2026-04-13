package TreeSitterCisco;

use 5.030000;
use strict;
use warnings;

require Exporter;
our @ISA = qw(Exporter);
our %EXPORT_TAGS = ( 'all' => [ qw( language ) ] );
our @EXPORT_OK = ( @{ $EXPORT_TAGS{'all'} } );
our @EXPORT = qw( language );

our $VERSION = '1.0.0';

require XSLoader;
XSLoader::load('TreeSitterCisco', $VERSION);

1;
