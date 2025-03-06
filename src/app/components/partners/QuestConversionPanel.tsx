import { useMemo, useState } from "preact/hooks"
import config from "../../Config.js"
import { useLocale, useVersion } from "../../contexts/index.js"
import { checkVersion, VersionId } from "../../services/index.js"
import { Btn } from "../Btn.jsx"
import { FileUpload } from "../FileUpload.jsx"
import { Footer } from "../Footer.jsx"
import { VersionSwitcher } from "../index.js"
import { convert } from "./QuestConverter.js"
import "./styles.css"

const MIN_VERSION = '1.21'

const OTHERS_VERSION = ['1.18.2', '1.20']

interface Props {
	path?: string
}
export function QuestConversionPanel(_props: Props) {
	const { locale } = useLocale()
	const { version, changeVersion } = useVersion()

	const [file, setFile] = useState<File | undefined>(undefined)
	const [conversionResult, setRes] = useState<[string, Blob, {
		[file: string]: string[]
	}] | undefined>(undefined)

	const onUpload = async (input: File) => {
		setFile(input)
		const res = await convert(input, version)
		setRes([input.name, res[0], res[1]])
	}

	const allowedVersions = useMemo(() => {
		return config.versions
			.filter(v => checkVersion(v.id, MIN_VERSION) || OTHERS_VERSION.find(o => o === v.id))
			.map(v => v.id as VersionId)
			.reverse()
	}, [])

	return <main>
		<div class="simplequests-version-tab">
			<VersionSwitcher value={version} onChange={changeVersion} allowed={allowedVersions} />
		</div>
		<div class={"simplequests-conversion-container"}>
			<label>{locale("generator.simplequests.converter")}</label>
			<FileUpload value={file} onChange={onUpload} label={locale('choose_zip_file')} accept=".zip" />
			{conversionResult &&
				<div class="simplequests-conversion-done">
					<label>{locale("generator.simplequests.converter.finished")}</label>
					<Btn icon="download" label="Download!" onClick={() => {
						const download = window.document.createElement("a")
						download.href = window.URL.createObjectURL(conversionResult[1])
						download.download = `${conversionResult[0]}`
						document.body.appendChild(download)
						download.click()
						download.remove()
					}} />
					{Object.keys(conversionResult[2]).length > 0 &&
						<>
							<label class="simplequests-error">{locale("generator.simplequests.converter.errors")}</label>
							{
								errorRender(conversionResult[2])
							}
						</>
					}
				</div>
			}
		</div>
		<Footer />
	</main>
}

function errorRender(map: {
	[file: string]: string[]
}) {
	return <table class="simplequests-error-table">
		<thead class="simplequests-error-table-head">
			<tr>
				<th>File</th>
				<th>Errors</th>
			</tr>
		</thead>
		<tbody class="simplequests-error-table-body">
			{Object.entries(map).map(([key, errors]) => (
				<tr>
					<td class="simplequests-error-table-tr error-table-column">{key}</td>
					<td class="simplequests-error-table-tr">
						{errors.map(e => (
							<li>{e}</li>
						))}
					</td>
				</tr>
			))}
		</tbody>
	</table>
}
