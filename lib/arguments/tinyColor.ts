import type { BotArgumentTypeCaster } from '#lib';
import assert from 'assert/strict';
import tinycolorModule from 'tinycolor2';
assert(tinycolorModule);

export const tinyColor: BotArgumentTypeCaster<string | null> = (_message, phrase) => {
	// if the phase is a number it converts it to hex incase it could be representing a color in decimal
	const newPhase = isNaN(phrase as any) ? phrase : `#${Number(phrase).toString(16)}`;
	return tinycolorModule(newPhase).isValid() ? newPhase : null;
};
