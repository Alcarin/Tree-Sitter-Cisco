use ExtUtils::MakeMaker;

WriteMakefile(
    NAME              => 'TreeSitterCisco',
    VERSION_FROM      => 'lib/TreeSitterCisco/Cisco.pm',
    PREREQ_PM         => {},
    LIBS              => [''],
    DEFINE            => '',
    INC               => '-I. -I../../src',
    OBJECT            => 'Cisco.o ../../src/parser.o ../../src/scanner.o',
);
