import React from "react";

interface StatusPanelProps {
	textoCapturated: string;
	config: {
		focusTime: number;
		breakTime: number;
	} | null;
	status: string;
	isIAUsed: boolean;
	progressEnd: boolean;
	progress: string;
}

export function StatusPanel({
	textoCapturated,
	config,
	status,
	isIAUsed,
	progressEnd,
	progress,	
}: StatusPanelProps) {
	return (
		<>
			{textoCapturated && !config && <p className="mt-6 text-center text-black-700 font-medium min-h-[2rem]">texto capturado: {textoCapturated}</p>}

			<p className="mt-6 text-center text-blue-700 font-medium min-h-[2rem]">{status}</p>
			{isIAUsed && !progressEnd && progress && <p className="mt-2 text-sm text-cyan-700 text-center">Progreso: {progress}</p>}
		</>
	);
}