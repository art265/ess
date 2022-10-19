import Image from "next/future/image";
import { useState, useRef, useCallback, type MouseEventHandler } from "react";
import { AiFillCaretDown } from "react-icons/ai";
import { MdClear } from "react-icons/md";
import type { AutoRoleFlagId, Role } from "../../contexts/GuildContext";
import useClickOutside from "../../hooks/useClickOutside";
import { getDatabaseLimit } from "../../utils/common";
import { FlagInfo, type Snowflake } from "../../utils/constants";
import Selector from "../form/Selector";

export type AutoRoleFlagsOnChangeFn = (roleIds: Snowflake[], flagId: AutoRoleFlagId) => unknown;

interface XpRoleProps {
	disabled?: boolean;
	flagId: AutoRoleFlagId;
	initialRoles: Snowflake[];
	onChange: AutoRoleFlagsOnChangeFn;
	premium: boolean;
	roles: Role[];
}

export default function AutoRoleFlag({
	flagId,
	initialRoles,
	onChange,
	premium,
	roles,
	disabled = false,
}: XpRoleProps) {
	const id = `arf-${flagId}-roles`;
	const { icon, name } = FlagInfo[flagId];

	return (
		<div className="flex flex-col items-center justify-between gap-y-2 rounded-lg bg-discord-dark px-4 py-2 shadow-lg">
			<div className="flex h-8 w-full">
				<label
					className="mr-2 flex shrink-0 items-center justify-center gap-1 rounded-full bg-discord-not-quite-black px-3 text-white shadow-lg"
					htmlFor={id}
				>
					<Image alt={`${name} badge icon`} height={20} src={icon} width={20} />

					<p>{name}</p>
				</label>

				<MdClear
					className="ml-auto mt-0 h-8 w-8 cursor-pointer py-1 text-red-500"
					onClick={() => onChange([], flagId)}
				/>
			</div>

			<div className="w-full">
				<Selector
					disabled={disabled}
					id={id}
					initialItems={initialRoles}
					items={roles}
					limit={getDatabaseLimit("autoRoleFlagsRoles", premium).maxLength}
					onSelect={(roleIds) => onChange(roleIds, flagId)}
					type="Role"
				/>
			</div>
		</div>
	);
}

export interface AutoRoleFlagItemInfo {
	flagId: AutoRoleFlagId;
	icon: typeof FlagInfo[keyof typeof FlagInfo]["icon"];
	name: typeof FlagInfo[keyof typeof FlagInfo]["name"];
}

interface AutoRoleFlagSelectorProps {
	initialItem: AutoRoleFlagItemInfo;
	items: AutoRoleFlagItemInfo[];
	onSelect(item: AutoRoleFlagItemInfo): unknown;
}

export function AutoRoleFlagSelector({ initialItem, items, onSelect }: AutoRoleFlagSelectorProps) {
	const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
	const [selected, setSelected] = useState<AutoRoleFlagItemInfo>(initialItem);
	const elementRef = useRef<HTMLDivElement>(null);

	const handleClickOutside = useCallback(() => setDropdownOpen(false), []);

	useClickOutside(elementRef, handleClickOutside);

	const handleItemChange: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const flagId = Number.parseInt((event.target as HTMLDivElement | HTMLParagraphElement).dataset.id ?? "NaN", 10);
			if (Number.isNaN(flagId)) return;

			const item = items.find((item) => item.flagId === flagId);
			if (!item) {
				console.warn("[BasicSelect] Couldn't find the item when user tried changing item");
				return;
			}

			onSelect(item);
			setSelected(item);
			setDropdownOpen(false);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[items],
	);

	return (
		<div className="relative w-full cursor-pointer text-white" ref={elementRef}>
			<div
				className="flex h-12 w-full flex-row flex-wrap gap-1.5 rounded-md bg-discord-not-quite-black py-3 px-5 shadow focus:outline-none"
				onClick={() => setDropdownOpen(!dropdownOpen)}
			>
				<div className="flex items-center gap-1">
					<Image alt={`${selected.name} Badge Icon`} height={20} src={selected.icon} width={20} />

					<span className="z-50 flex w-full items-center py-1 px-1.5 leading-3 ">{selected.name}</span>
				</div>

				<div className="absolute right-0 my-auto mx-4 h-full text-2xl transition-colors">
					<AiFillCaretDown />
				</div>
			</div>

			<div
				className={`${
					dropdownOpen ? "" : "hidden"
				} absolute z-[100] mt-2 flex max-h-64 w-full flex-col items-center rounded-md bg-[#36393f]`}
			>
				<div className="my-2 flex h-full w-full flex-col gap-1 overflow-y-scroll">
					{items.map(({ flagId, icon, name }, idx) => (
						<div
							className="flex cursor-pointer items-center gap-2 rounded-lg py-2 px-4 text-center hover:bg-discord-lighter"
							data-id={flagId.toString()}
							key={flagId.toString()}
							onClick={handleItemChange}
						>
							<Image alt={`${name} Badge Icon`} height={20} src={icon} width={20} />

							<p data-id={flagId.toString()}>{name}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
