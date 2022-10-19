import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MdPlaylistAdd } from "react-icons/md";
import {
	GuildContext,
	type AutoRoleFlagId,
	type AutoRoleFlags,
	type GuildSettings,
	type Role,
} from "../../../contexts/GuildContext";
import { formatNumberToNDecimalPlaces, getDatabaseLimit, parseFloatStrict } from "../../../utils/common";
import { FlagInfo, type Snowflake } from "../../../utils/constants";
import Field from "../../form/Field";
import Fieldset from "../../form/Fieldset";
import Input from "../../form/Input";
import Label from "../../form/Label";
import Selector from "../../form/Selector";
import Subtitle from "../../form/Subtitle";
import AutoRoleFlag, { AutoRoleFlagSelector, type AutoRoleFlagItemInfo } from "../AutoRoleFlag";
import Header from "../Header";

interface AutoroleProps {
	openMenu(): void;
	roles: Role[];
	settings: GuildSettings;
}

export default function Autorole({ settings, roles, openMenu }: AutoroleProps) {
	const [autoRoleFlags, setAutoRoleFlags] = useState<AutoRoleFlags[]>(settings.autoRoleFlags);
	const [newAutoRoleFlagId, setNewAutoRoleFlagId] = useState<AutoRoleFlagId>(1);
	const [initialAutoRoleFlagItem, setInitialAutoRoleFlagItem] = useState<AutoRoleFlagItemInfo | null>({
		...FlagInfo[1],
		flagId: 1,
	});

	// eslint-disable-next-line @typescript-eslint/unbound-method
	const { addChange } = useContext(GuildContext);

	const autoRoleLimit = getDatabaseLimit("autoRole", settings.premium).maxLength;
	const autoRoleFlagsLimit = getDatabaseLimit("autoRoleFlags", settings.premium).maxLength;
	const autoRoleFlagRolesLimit = getDatabaseLimit("autoRoleFlagsRoles", settings.premium).maxLength;
	const autoRoleTimeoutLimits = getDatabaseLimit("autoRoleTimeout", settings.premium);

	useEffect(() => window.scroll({ behavior: "auto", left: 0, top: 0 }), [openMenu]);

	const availableFlags = useMemo((): AutoRoleFlagItemInfo[] => {
		const flags = Object.entries(FlagInfo)
			.map(([flagId, { icon, name }]) => ({ icon, flagId: Number.parseInt(flagId, 10) as AutoRoleFlagId, name }))
			.filter(({ flagId }) => !autoRoleFlags.some((flag) => flag.flagId === flagId))
			.sort((a, b) => a.name.localeCompare(b.name));

		setInitialAutoRoleFlagItem(flags[0] ?? null);

		return flags;
	}, [autoRoleFlags]);

	const handleAutoRoleFlagChange = useCallback(
		(roleIds: Snowflake[], flagId: AutoRoleFlagId) => {
			const clone = [...autoRoleFlags];
			const index = clone.findIndex((flag) => flag.flagId === flagId);

			if (roleIds.length) {
				if (index === -1) {
					setAutoRoleFlags([...autoRoleFlags, { flagId, roleIds }]);
				} else {
					clone[index].roleIds = roleIds;
					setAutoRoleFlags(clone);
				}

				return;
			}

			if (index !== -1) {
				console.warn("Removing inexistent auto role flag", flagId);
				return;
			}

			clone.splice(index, 1);
			setAutoRoleFlags(clone);
		},
		[autoRoleFlags],
	);

	return (
		<>
			<Header
				description="Autoroles consist of roles that are given to users when they join the server."
				openMenu={openMenu}
				title="Autorole"
			/>

			<Fieldset>
				<Field>
					<Label
						htmlFor="autoRole"
						name="On Join Roles"
						url="https://docs.pepemanager.com/guides/automatically-added-roles-with-timeout"
					/>
					<Selector
						id="autoRole"
						initialItems={(settings.autoRole as Snowflake[] | null) ?? []}
						items={roles}
						limit={autoRoleLimit}
						onSelect={(roleIds) => addChange("autoRole", roleIds)}
						type="Role"
					/>
					<Subtitle text={`Maximum of ${autoRoleLimit} roles.`} />
				</Field>

				<Field>
					<Label
						htmlFor="autoRoleFlags"
						name="On Join Roles Badges"
						url="https://docs.pepemanager.com/guides/automatically-added-roles-with-timeout"
					/>

					<div>
						{autoRoleFlags.length < autoRoleFlagsLimit && (
							<div className="flex max-w-md flex-col">
								<p className="text-white">Create a new badge</p>

								<div className="mt-2 mb-4 flex flex-row gap-3">
									<AutoRoleFlagSelector
										// This always exists due to the length check above
										initialItem={initialAutoRoleFlagItem!}
										items={availableFlags}
										onSelect={({ flagId }) => setNewAutoRoleFlagId(flagId)}
									/>

									<button
										className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-discord-not-quite-black text-white transition-colors duration-150 hover:text-opacity-75"
										onClick={(event) => {
											event.preventDefault();

											const finalAutoRoleFlags = [...autoRoleFlags, { flagId: newAutoRoleFlagId, roleIds: [] }];
											setAutoRoleFlags(finalAutoRoleFlags);
											addChange("autoRoleFlags", finalAutoRoleFlags);
										}}
										type="button"
									>
										<MdPlaylistAdd className="fill-current text-3xl" />
									</button>
								</div>
							</div>
						)}
					</div>

					{autoRoleFlags.map(({ flagId, roleIds }, index) => (
						<AutoRoleFlag
							flagId={flagId}
							initialRoles={roleIds}
							key={index}
							onChange={handleAutoRoleFlagChange}
							premium={settings.premium}
							roles={roles}
						/>
					))}
					<Subtitle text={`Maximum of ${autoRoleFlagRolesLimit} roles per badge.`} />
				</Field>

				<Field>
					<Label
						htmlFor="autoRoleTimeout"
						name="On Join Role Timer (Minutes)"
						url="https://docs.pepemanager.com/guides/automatically-added-roles-with-timeout#setting-your-timeout"
					/>
					<div className="max-w-md">
						<Input
							id="autoRoleTimeout"
							initialValue={
								settings.autoRoleTimeout ? formatNumberToNDecimalPlaces(settings.autoRoleTimeout / 60_000) : ""
							}
							maxLength={32}
							onChange={(text) => addChange("autoRoleTimeout", text ? parseFloatStrict(text) : null)}
							placeholder="Enter the autorole timeout"
						/>
					</div>
					<Subtitle
						text={`Between ${autoRoleTimeoutLimits.min / 60_000} - ${autoRoleTimeoutLimits.max / 60_000} minutes.`}
					/>
				</Field>
			</Fieldset>
		</>
	);
}
