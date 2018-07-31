import csvprocessor
import clargs
import sys

args = clargs.CLArguments(sys.argv)


with open(args.csv) as csvfile:
	csvprocessor.processCsv(csvfile, args.json)